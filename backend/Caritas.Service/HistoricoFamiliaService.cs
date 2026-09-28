using Caritas.Models.DTOs.Familia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

// Agrega a linha do tempo de uma família a partir das três fontes que a referenciam:
// Atendimento.FamiliaId, Entrega.IdFamilia e LancamentoCaixa.FamiliaId.
//
// O merge e a paginação são feitos em memória porque as fontes são tabelas distintas — cada
// consulta já filtra por família e paróquia no SQL, então o volume carregado é o histórico de
// uma única família. Se isso crescer muito, o caminho é uma view com UNION ALL no Postgres.
public class HistoricoFamiliaService(CaritasDbContext context, ICurrentSession session)
    : IHistoricoFamiliaService
{
    public async Task<PagedResponseDto<EventoHistoricoDto>> GetAsync(
        int familiaId, int page, int pageSize, bool incluirEntregas, bool incluirCaixa)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        var familiaOk = await context.Familias
            .AnyAsync(f => f.Id == familiaId && f.ParoquiaId == idParoquia);
        if (!familiaOk)
            throw new KeyNotFoundException($"Família {familiaId} não encontrada nesta paróquia.");

        var eventos = new List<EventoHistoricoDto>();

        var atendimentos = await context.Atendimentos
            .Include(a => a.Voluntario)
            .Where(a => a.FamiliaId == familiaId && a.ParoquiaId == idParoquia)
            .ToListAsync();
        eventos.AddRange(atendimentos.Select(a => a.ToEventoDto()));

        if (incluirEntregas)
            eventos.AddRange(await GetEventosEntregaAsync(familiaId, idParoquia));

        if (incluirCaixa)
        {
            // Mesmos predicados de CaixaService.GetRelatorioAsync: exclui cancelados e os
            // estornos automáticos (que não têm Destino nem FamiliaId).
            var saidas = await context.LancamentosCaixa
                .Where(l => l.FamiliaId == familiaId
                         && l.ParoquiaId == idParoquia
                         && l.Tipo == TipoLancamento.Saida
                         && !l.Cancelado
                         && l.Destino != null)
                .ToListAsync();
            eventos.AddRange(saidas.Select(l => l.ToEventoDto()));
        }

        var ordenados = eventos
            .OrderByDescending(e => e.Data)
            .ThenByDescending(e => e.Id)
            .ToList();

        return new()
        {
            Items = ordenados.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
            TotalCount = ordenados.Count,
        };
    }

    // Resumo por entrega, sem N+1: cestas = Σ quantidade; itens = nº de linhas de movimentação.
    // Mesmo cálculo de EntregaService.GetPagedAsync.
    private async Task<List<EventoHistoricoDto>> GetEventosEntregaAsync(int familiaId, int idParoquia)
    {
        var entregas = await context.Entregas
            .Where(e => e.IdFamilia == familiaId && e.IdParoquia == idParoquia)
            .ToListAsync();
        if (entregas.Count == 0) return [];

        var ids = entregas.Select(e => e.Id).ToList();

        var qtdCestas = await context.MovimentacoesCesta
            .Where(m => m.IdEntrega != null && ids.Contains(m.IdEntrega.Value))
            .GroupBy(m => m.IdEntrega!.Value)
            .Select(g => new { Id = g.Key, Qtd = g.Sum(x => x.Quantidade) })
            .ToDictionaryAsync(x => x.Id, x => x.Qtd);

        var qtdItens = await context.Movimentacoes
            .Where(m => m.OrigemTipo == OrigemMovimentacao.Entrega
                     && m.OrigemId != null
                     && ids.Contains(m.OrigemId.Value))
            .GroupBy(m => m.OrigemId!.Value)
            .Select(g => new { Id = g.Key, Qtd = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Qtd);

        return entregas
            .Select(e => e.ToEventoDto(qtdCestas.GetValueOrDefault(e.Id), qtdItens.GetValueOrDefault(e.Id)))
            .ToList();
    }
}
