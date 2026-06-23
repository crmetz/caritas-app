using Caritas.Models.DTOs.Bazar;
using Caritas.Models.DTOs.Brecho;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class BrechoService(CaritasDbContext context)
{
    public async Task<PagedResponseDto<PecaResponseDto>> GetPecasPagedAsync(int paroquiaId, int page, int pageSize)
    {
        var paged = await context.Pecas
            .Where(p => p.ParoquiaId == paroquiaId)
            .OrderBy(p => p.Categoria)
            .ToPagedAsync(page, pageSize);

        return new PagedResponseDto<PecaResponseDto>
        {
            Items = paged.Items.Select(MapPeca),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task<PecaResponseDto> CreatePecaAsync(PecaBrechoCreateDto dto)
    {
        var peca = new Peca
        {
            Categoria = dto.Categoria,
            Descricao = dto.Descricao,
            Quantidade = dto.Quantidade,
            Preco = dto.Preco,
            ParoquiaId = dto.ParoquiaId,
        };

        await context.Pecas.AddAsync(peca);
        await context.SaveChangesAsync();
        return MapPeca(peca);
    }

    public async Task<PecaResponseDto> UpdatePecaAsync(int id, PecaBrechoCreateDto dto)
    {
        var peca = await context.Pecas.FirstOrDefaultAsync(p => p.Id == id && p.ParoquiaId == dto.ParoquiaId)
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
        var peca = await context.Pecas.FirstOrDefaultAsync(p => p.Id == id && p.ParoquiaId != null)
            ?? throw new KeyNotFoundException($"Peça com id {id} não encontrada.");

        context.Pecas.Remove(peca);
        await context.SaveChangesAsync();
    }

    public async Task<VendaBrechoResponseDto> CreateVendaAsync(VendaBrechoCreateDto dto)
    {
        if (!dto.Itens.Any())
            throw new ArgumentException("A venda deve ter pelo menos um item.");

        var caixaAberto = await context.SessoesCaixaBrecho
            .AnyAsync(s => s.ParoquiaId == dto.ParoquiaId && s.Aberto);

        if (!caixaAberto)
            throw new InvalidOperationException("Caixa do Brechó está fechado. Abra o caixa para registrar vendas.");

        await using var transaction = await context.Database.BeginTransactionAsync();

        foreach (var item in dto.Itens)
        {
            var peca = await context.Pecas
                .FirstOrDefaultAsync(p => p.Id == item.PecaId && p.ParoquiaId == dto.ParoquiaId)
                ?? throw new KeyNotFoundException($"Peça com id {item.PecaId} não encontrada.");

            if (peca.Quantidade < item.Quantidade)
                throw new InvalidOperationException(
                    $"Estoque insuficiente para '{peca.Categoria}'. Disponível: {peca.Quantidade}.");

            peca.Quantidade -= item.Quantidade;
        }

        var valorTotal = dto.Itens.Sum(i => i.Quantidade * i.ValorUnitario);

        var venda = new VendaBrecho
        {
            ParoquiaId = dto.ParoquiaId,
            CompradorNome = dto.Comprador.Nome,
            CompradorCpf = dto.Comprador.Cpf,
            CompradorIdentificacaoAlternativa = dto.Comprador.IdentificacaoAlternativa,
            FormaPagamento = dto.FormaPagamento,
            ValorTotal = valorTotal,
            DataVenda = DateTime.UtcNow,
            RegistradoPor = dto.RegistradoPor,
            Itens = dto.Itens.Select(i => new ItemVendaBrecho
            {
                PecaId = i.PecaId,
                Quantidade = i.Quantidade,
                ValorUnitario = i.ValorUnitario,
            }).ToList(),
        };

        await context.VendasBrecho.AddAsync(venda);
        await context.SaveChangesAsync();

        // Lançamento automático no Caixa Paroquial
        var lancamento = new LancamentoCaixa
        {
            ParoquiaId = dto.ParoquiaId,
            Data = DateTime.UtcNow,
            Tipo = TipoLancamento.Entrada,
            Valor = valorTotal,
            Origem = OrigemEntrada.VendaBrecho,
            VendaBrechoId = venda.Id,
            Responsavel = dto.RegistradoPor,
            GeradoAutomaticamente = true,
        };

        await context.LancamentosCaixa.AddAsync(lancamento);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        var vendaCriada = await context.VendasBrecho
            .Include(v => v.Itens).ThenInclude(i => i.Peca)
            .FirstAsync(v => v.Id == venda.Id);

        return MapVenda(vendaCriada);
    }

    public async Task<PagedResponseDto<VendaBrechoResponseDto>> GetVendasPagedAsync(
        int paroquiaId, int page, int pageSize,
        DateTime? abertoDesde = null, DateTime? ateData = null)
    {
        var paged = await context.VendasBrecho
            .Include(v => v.Itens).ThenInclude(i => i.Peca)
            .Where(v => v.ParoquiaId == paroquiaId
                     && (abertoDesde == null || v.DataVenda >= abertoDesde)
                     && (ateData == null || v.DataVenda <= ateData))
            .OrderByDescending(v => v.DataVenda)
            .ToPagedAsync(page, pageSize);

        return new PagedResponseDto<VendaBrechoResponseDto>
        {
            Items = paged.Items.Select(MapVenda),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task CancelarVendaAsync(int id, CancelarVendaBrechoDto dto)
    {
        var venda = await context.VendasBrecho
            .Include(v => v.Itens).ThenInclude(i => i.Peca)
            .Include(v => v.LancamentoCaixa)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new KeyNotFoundException($"Venda com id {id} não encontrada.");

        if (venda.Cancelado)
            throw new InvalidOperationException("Esta venda já foi cancelada.");

        var caixaAberto = await context.SessoesCaixaBrecho
            .AnyAsync(s => s.ParoquiaId == venda.ParoquiaId && s.Aberto);

        if (!caixaAberto)
            throw new InvalidOperationException("Caixa do Brechó está fechado. Abra o caixa para cancelar vendas.");

        await using var transaction = await context.Database.BeginTransactionAsync();

        venda.Cancelado = true;
        venda.CanceladoEm = DateTime.UtcNow;
        venda.MotivoCancelamento = dto.Motivo;
        venda.CanceladoPor = dto.CanceladoPor;

        foreach (var item in venda.Itens)
            item.Peca.Quantidade += item.Quantidade;

        if (venda.LancamentoCaixa is not null)
            context.LancamentosCaixa.Remove(venda.LancamentoCaixa);

        await context.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    private static VendaBrechoResponseDto MapVenda(VendaBrecho v) => new()
    {
        Id = v.Id,
        DataVenda = v.DataVenda,
        CompradorNome = v.CompradorNome,
        CompradorCpf = v.CompradorCpf,
        CompradorIdentificacaoAlternativa = v.CompradorIdentificacaoAlternativa,
        FormaPagamento = v.FormaPagamento,
        ValorTotal = v.ValorTotal,
        QuantidadeItens = v.Itens.Sum(i => i.Quantidade),
        RegistradoPor = v.RegistradoPor,
        Cancelado = v.Cancelado,
        CanceladoEm = v.CanceladoEm,
        MotivoCancelamento = v.MotivoCancelamento,
        CanceladoPor = v.CanceladoPor,
        Itens = v.Itens.Select(i => new ItemVendaBrechoResponseDto
        {
            Categoria = i.Peca.Categoria,
            Quantidade = i.Quantidade,
            ValorUnitario = i.ValorUnitario,
        }),
        CriadoEm = v.CriadoEm,
    };

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
}
