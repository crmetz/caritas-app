using Caritas.Models.DTOs.Entrega;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class EntregaService(
    CaritasDbContext context,
    IEntregaRepository entregaRepository,
    IMovimentacaoService movimentacaoService,
    ICurrentSession session) : IEntregaService
{
    public async Task<EntregaResponseDto> RegistrarAsync(EntregaCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        if (dto.Itens.Count == 0 && dto.Cestas.Count == 0)
            throw new ArgumentException("A entrega deve conter ao menos uma cesta ou item.");

        var familiaOk = await context.Familias
            .AnyAsync(f => f.Id == dto.IdFamilia && f.ParoquiaId == idParoquia);
        if (!familiaOk)
            throw new KeyNotFoundException($"Família {dto.IdFamilia} não encontrada nesta paróquia.");

        await using var tx = await context.Database.BeginTransactionAsync();

        var entrega = new Entrega
        {
            IdParoquia = idParoquia, IdFamilia = dto.IdFamilia, Observacao = dto.Observacao,
        };
        entregaRepository.Add(entrega);
        await context.SaveChangesAsync();   // gera entrega.Id

        // Alimentos/Roupas: saída do estoque ligada à entrega (saldo validado em AplicarMovimentoAsync).
        foreach (var linha in dto.Itens)
        {
            await movimentacaoService.AplicarMovimentoAsync(new MovimentacaoEstoque
            {
                IdItem = linha.IdItem, IdParoquia = idParoquia,
                Tamanho = await movimentacaoService.ResolverTamanhoAsync(linha.IdItem, linha.TamanhoValor, linha.TamanhoUnidade),
                Validade = linha.Validade, Lote = linha.Lote,
                TipoOperacao = TipoOperacao.Saida, Quantidade = linha.Quantidade,
                OrigemTipo = OrigemMovimentacao.Entrega, OrigemId = entrega.Id,
            });
        }

        // Cestas: baixa (Motivo=Entregue) de cada lote, decrementando o saldo disponível.
        foreach (var c in dto.Cestas)
        {
            var lote = await context.LotesCesta
                .FirstOrDefaultAsync(l => l.Id == c.IdLoteCesta && l.IdParoquia == idParoquia)
                ?? throw new KeyNotFoundException($"Lote de cesta {c.IdLoteCesta} não encontrado.");
            if (c.Quantidade > lote.QuantidadeDisponivel)
                throw new InvalidOperationException("Quantidade maior que o saldo disponível do lote.");

            context.MovimentacoesCesta.Add(new MovimentacaoCesta
            {
                IdLoteCesta = lote.Id, IdParoquia = idParoquia,
                Motivo = MotivoBaixaCesta.Entregue, IdEntrega = entrega.Id,
                Quantidade = c.Quantidade, Observacao = dto.Observacao,
            });
            lote.QuantidadeDisponivel -= c.Quantidade;
        }

        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return entrega.ToResponseDto();
    }

    public async Task<PagedResponseDto<EntregaListItemDto>> GetPagedAsync(int page, int pageSize)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        var paged = await entregaRepository.GetPagedAsync(idParoquia, page, pageSize);
        var ids = paged.Items.Select(e => e.Id).ToList();

        // Resumo por entrega, sem N+1: cestas = Σ quantidade; itens = nº de linhas de movimentação.
        var qtdCestas = ids.Count == 0
            ? new Dictionary<int, int>()
            : await context.MovimentacoesCesta
                .Where(m => m.IdEntrega != null && ids.Contains(m.IdEntrega.Value))
                .GroupBy(m => m.IdEntrega!.Value)
                .Select(g => new { Id = g.Key, Qtd = g.Sum(x => x.Quantidade) })
                .ToDictionaryAsync(x => x.Id, x => x.Qtd);

        var qtdItens = ids.Count == 0
            ? new Dictionary<int, int>()
            : await context.Movimentacoes
                .Where(m => m.OrigemTipo == OrigemMovimentacao.Entrega && m.OrigemId != null && ids.Contains(m.OrigemId.Value))
                .GroupBy(m => m.OrigemId!.Value)
                .Select(g => new { Id = g.Key, Qtd = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Qtd);

        var items = paged.Items.Select(e =>
            e.ToListItemDto(qtdCestas.GetValueOrDefault(e.Id), qtdItens.GetValueOrDefault(e.Id)));
        return new() { Items = items, TotalCount = paged.TotalCount };
    }
}
