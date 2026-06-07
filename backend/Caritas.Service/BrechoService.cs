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

    public async Task CreateVendaAsync(VendaBrechoCreateDto dto)
    {
        if (!dto.Itens.Any())
            throw new ArgumentException("A venda deve ter pelo menos um item.");

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
            Responsavel = dto.Comprador.Nome,
            GeradoAutomaticamente = true,
        };

        await context.LancamentosCaixa.AddAsync(lancamento);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
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
}
