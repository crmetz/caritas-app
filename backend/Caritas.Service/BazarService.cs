using Caritas.Models.DTOs.Bazar;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class BazarService(CaritasDbContext context)
{
    public async Task<PagedResponseDto<PecaResponseDto>> GetPecasPagedAsync(int page, int pageSize)
    {
        var paged = await context.Pecas
            .Where(p => p.ParoquiaId == null)
            .OrderByDescending(p => p.CriadoEm)
            .ToPagedAsync(page, pageSize);

        return new PagedResponseDto<PecaResponseDto>
        {
            Items = paged.Items.Select(MapPeca),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task<PecaResponseDto> CreatePecaAsync(PecaCreateDto dto)
    {
        var peca = new Peca
        {
            Categoria = dto.Categoria,
            Descricao = dto.Descricao,
            Quantidade = dto.Quantidade,
            Preco = dto.Preco,
        };

        await context.Pecas.AddAsync(peca);
        await context.SaveChangesAsync();
        return MapPeca(peca);
    }

    public async Task<PecaResponseDto> UpdatePecaAsync(int id, PecaUpdateDto dto)
    {
        var peca = await context.Pecas.FirstOrDefaultAsync(p => p.Id == id && p.ParoquiaId == null)
            ?? throw new KeyNotFoundException($"Peça com id {id} não encontrada.");

        peca.Categoria = dto.Categoria;
        peca.Descricao = dto.Descricao;
        peca.Quantidade = dto.Quantidade;
        peca.Preco = dto.Preco;

        await context.SaveChangesAsync();
        return MapPeca(peca);
    }

    public async Task DeletePecaAsync(int id)
    {
        var peca = await context.Pecas.FirstOrDefaultAsync(p => p.Id == id && p.ParoquiaId == null)
            ?? throw new KeyNotFoundException($"Peça com id {id} não encontrada.");

        context.Pecas.Remove(peca);
        await context.SaveChangesAsync();
    }

    public async Task<VendaBazarResponseDto> CreateVendaAsync(VendaBazarCreateDto dto)
    {
        if (!dto.Itens.Any())
            throw new ArgumentException("A venda deve ter pelo menos um item.");

        await using var transaction = await context.Database.BeginTransactionAsync();

        foreach (var item in dto.Itens)
        {
            var peca = await context.Pecas.FirstOrDefaultAsync(p => p.Id == item.PecaId && p.ParoquiaId == null)
                ?? throw new KeyNotFoundException($"Peça com id {item.PecaId} não encontrada.");

            if (peca.Quantidade < item.Quantidade)
                throw new InvalidOperationException(
                    $"Estoque insuficiente para '{peca.Categoria}'. Disponível: {peca.Quantidade}.");

            peca.Quantidade -= item.Quantidade;
        }

        var venda = new VendaBazar
        {
            CompradorNome = dto.Comprador.Nome,
            CompradorCpf = dto.Comprador.Cpf,
            CompradorIdentificacaoAlternativa = dto.Comprador.IdentificacaoAlternativa,
            FormaPagamento = dto.FormaPagamento,
            ValorTotal = dto.Itens.Sum(i => i.Quantidade * i.ValorUnitario),
            DataVenda = DateTime.UtcNow,
            RegistradoPor = dto.RegistradoPor,
            Itens = dto.Itens.Select(i => new ItemVendaBazar
            {
                PecaId = i.PecaId,
                Quantidade = i.Quantidade,
                ValorUnitario = i.ValorUnitario,
            }).ToList(),
        };

        await context.VendasBazar.AddAsync(venda);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetVendaResponseAsync(venda.Id);
    }

    public async Task<PagedResponseDto<VendaBazarResponseDto>> GetVendasPagedAsync(
        int page, int pageSize, DateTime? dataInicio = null, DateTime? dataFim = null)
    {
        var query = context.VendasBazar
            .Include(v => v.Itens).ThenInclude(i => i.Peca)
            .AsQueryable();

        if (dataInicio.HasValue)
        {
            var inicio = DateTime.SpecifyKind(dataInicio.Value, DateTimeKind.Utc);
            query = query.Where(v => v.DataVenda >= inicio);
        }

        if (dataFim.HasValue)
        {
            var fim = DateTime.SpecifyKind(dataFim.Value.AddDays(1), DateTimeKind.Utc);
            query = query.Where(v => v.DataVenda < fim);
        }

        var paged = await query
            .OrderByDescending(v => v.CriadoEm)
            .ToPagedAsync(page, pageSize);

        return new PagedResponseDto<VendaBazarResponseDto>
        {
            Items = paged.Items.Select(MapVenda),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task CancelarVendaAsync(int id, CancelarVendaBazarDto dto)
    {
        var venda = await context.VendasBazar
            .Include(v => v.Itens)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new KeyNotFoundException($"Venda com id {id} não encontrada.");

        if (venda.Cancelado)
            throw new InvalidOperationException("Esta venda já foi cancelada.");

        await using var transaction = await context.Database.BeginTransactionAsync();

        foreach (var item in venda.Itens)
        {
            var peca = await context.Pecas.FirstOrDefaultAsync(p => p.Id == item.PecaId && p.ParoquiaId == null);
            if (peca != null)
                peca.Quantidade += item.Quantidade;
        }

        venda.Cancelado = true;
        venda.CanceladoEm = DateTime.UtcNow;
        venda.MotivoCancelamento = dto.Motivo;
        venda.CanceladoPor = dto.CanceladoPor;

        await context.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    public async Task<RelatorioBazarDto> GetRelatorioAsync(DateTime dataInicio, DateTime dataFim)
    {
        dataInicio = DateTime.SpecifyKind(dataInicio, DateTimeKind.Utc);
        dataFim = DateTime.SpecifyKind(dataFim.AddDays(1), DateTimeKind.Utc);

        var vendas = await context.VendasBazar
            .Include(v => v.Itens).ThenInclude(i => i.Peca)
            .Where(v => v.DataVenda >= dataInicio && v.DataVenda <= dataFim)
            .ToListAsync();

        var porCategoria = vendas
            .SelectMany(v => v.Itens)
            .GroupBy(i => i.Peca.Categoria)
            .Select(g => new VendaPorCategoriaDto
            {
                Categoria = g.Key,
                Quantidade = g.Sum(i => i.Quantidade),
                Total = g.Sum(i => i.Quantidade * i.ValorUnitario),
            })
            .OrderByDescending(x => x.Total);

        return new RelatorioBazarDto
        {
            TotalPecasVendidas = vendas.SelectMany(v => v.Itens).Sum(i => i.Quantidade),
            TotalArrecadado = vendas.Sum(v => v.ValorTotal),
            VendasPorCategoria = porCategoria,
        };
    }

    private async Task<VendaBazarResponseDto> GetVendaResponseAsync(int id)
    {
        var venda = await context.VendasBazar
            .Include(v => v.Itens).ThenInclude(i => i.Peca)
            .FirstAsync(v => v.Id == id);
        return MapVenda(venda);
    }

    private static PecaResponseDto MapPeca(Peca p) => new()
    {
        Id = p.Id,
        Categoria = p.Categoria,
        Descricao = p.Descricao,
        Quantidade = p.Quantidade,
        Preco = p.Preco,
        ParoquiaId = p.ParoquiaId,
        CriadoEm = p.CriadoEm,
        AtualizadoEm = p.AtualizadoEm,
    };

    private static VendaBazarResponseDto MapVenda(VendaBazar v) => new()
    {
        Id = v.Id,
        CompradorNome = v.CompradorNome,
        CompradorCpf = v.CompradorCpf,
        CompradorIdentificacaoAlternativa = v.CompradorIdentificacaoAlternativa,
        FormaPagamento = v.FormaPagamento,
        ValorTotal = v.ValorTotal,
        DataVenda = v.DataVenda,
        RegistradoPor = v.RegistradoPor,
        Cancelado = v.Cancelado,
        CanceladoEm = v.CanceladoEm,
        MotivoCancelamento = v.MotivoCancelamento,
        CanceladoPor = v.CanceladoPor,
        Itens = v.Itens.Select(i => new ItemVendaResponseDto
        {
            Id = i.Id,
            PecaId = i.PecaId,
            PecaCategoria = i.Peca.Categoria,
            Quantidade = i.Quantidade,
            ValorUnitario = i.ValorUnitario,
        }),
        CriadoEm = v.CriadoEm,
        AtualizadoEm = v.AtualizadoEm,
    };
}
