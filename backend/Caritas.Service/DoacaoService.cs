using Caritas.Models.DTOs.Doacao;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class DoacaoService(
    CaritasDbContext context,
    IDoacaoRepository doacaoRepository,
    IMovimentacaoService movimentacaoService,
    ICurrentSession session) : IDoacaoService
{
    public async Task<DoacaoResponseDto> RegistrarAsync(DoacaoCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        if (dto.Itens.Count == 0)
            throw new ArgumentException("Doação deve conter ao menos um item.");

        await using var tx = await context.Database.BeginTransactionAsync();

        var doacao = new Doacao
        {
            IdDoador = dto.IdDoador, IdParoquia = idParoquia,
            Tipo = TipoDoacao.Itens, Observacao = dto.Observacao,
        };
        doacaoRepository.Add(doacao);
        await context.SaveChangesAsync();   // gera doacao.Id

        foreach (var linha in dto.Itens)
        {
            await movimentacaoService.AplicarMovimentoAsync(new MovimentacaoEstoque
            {
                IdItem = linha.IdItem, IdParoquia = idParoquia,
                Tamanho = await movimentacaoService.ResolverTamanhoAsync(linha.IdItem, linha.TamanhoValor, linha.TamanhoUnidade),
                Validade = linha.Validade, Lote = linha.Lote,
                TipoOperacao = TipoOperacao.Entrada, Quantidade = linha.Quantidade,
                OrigemTipo = OrigemMovimentacao.Doacao, OrigemId = doacao.Id,
            });
        }

        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return doacao.ToResponseDto();
    }

    public async Task<DoacaoResponseDto> RegistrarCestasAsync(DoacaoCestaCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        await using var tx = await context.Database.BeginTransactionAsync();

        var doacao = new Doacao
        {
            IdDoador = dto.IdDoador, IdParoquia = idParoquia,
            Tipo = TipoDoacao.CestasFechadas, Observacao = dto.Observacao,
        };
        doacaoRepository.Add(doacao);
        await context.SaveChangesAsync();   // gera doacao.Id

        context.LotesCesta.Add(new LoteCesta
        {
            IdParoquia = idParoquia,
            Origem = OrigemCesta.Doacao,
            IdDoacao = doacao.Id,
            Quantidade = dto.Quantidade,
            QuantidadeDisponivel = dto.Quantidade,
            Observacao = dto.Observacao,
        });

        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return doacao.ToResponseDto();
    }

    public async Task<PagedResponseDto<DoacaoListItemDto>> GetPagedAsync(int page, int pageSize)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        var paged = await doacaoRepository.GetPagedAsync(idParoquia, page, pageSize);
        var ids = paged.Items.Select(d => d.Id).ToList();

        // Quantidade por doação, sem N+1: itens = nº de linhas de movimentação; cestas = nº de cestas do lote.
        var qtdItens = ids.Count == 0
            ? new Dictionary<int, int>()
            : await context.Movimentacoes
                .Where(m => m.OrigemTipo == OrigemMovimentacao.Doacao && m.OrigemId != null && ids.Contains(m.OrigemId.Value))
                .GroupBy(m => m.OrigemId!.Value)
                .Select(g => new { Id = g.Key, Qtd = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Qtd);

        var qtdCestas = ids.Count == 0
            ? new Dictionary<int, int>()
            : await context.LotesCesta
                .Where(l => l.IdDoacao != null && ids.Contains(l.IdDoacao.Value))
                .GroupBy(l => l.IdDoacao!.Value)
                .Select(g => new { Id = g.Key, Qtd = g.Sum(x => x.Quantidade) })
                .ToDictionaryAsync(x => x.Id, x => x.Qtd);

        var items = paged.Items.Select(d =>
        {
            var qtd = d.Tipo == TipoDoacao.CestasFechadas
                ? qtdCestas.GetValueOrDefault(d.Id)
                : qtdItens.GetValueOrDefault(d.Id);
            return d.ToListItemDto(qtd);
        });
        return new() { Items = items, TotalCount = paged.TotalCount };
    }
}
