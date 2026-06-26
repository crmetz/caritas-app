using Caritas.Models.DTOs.LoteCesta;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class LoteCestaService(
    CaritasDbContext context,
    ILoteCestaRepository loteRepository,
    IMovimentacaoCestaRepository movimentacaoRepository,
    ICurrentSession session) : ILoteCestaService
{
    public async Task<LoteCestaResponseDto> RegistrarBaixaAsync(int idLote, CestaBaixaCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        // Entregas à família são registradas em Entrega (fonte única); a baixa cobre só repasse/descarte/outro.
        if (dto.Motivo == MotivoBaixaCesta.Entregue)
            throw new ArgumentException("Entregas à família são registradas em Entregas, não na baixa do lote.");

        var lote = await loteRepository.GetByIdAsync(idLote);
        if (lote is null || lote.IdParoquia != idParoquia)
            throw new KeyNotFoundException($"Lote de cesta {idLote} não encontrado.");
        if (dto.Quantidade > lote.QuantidadeDisponivel)
            throw new InvalidOperationException("Quantidade maior que o saldo disponível do lote.");

        // Ledger + decremento do saldo num único SaveChanges (atômico).
        movimentacaoRepository.Add(new MovimentacaoCesta
        {
            IdLoteCesta = lote.Id, IdParoquia = idParoquia,
            Motivo = dto.Motivo,
            Quantidade = dto.Quantidade, Observacao = dto.Observacao,
        });
        lote.QuantidadeDisponivel -= dto.Quantidade;
        await context.SaveChangesAsync();

        return lote.ToResponseDto();
    }

    public async Task<PagedResponseDto<LoteCestaResponseDto>> GetControleAsync(int page, int pageSize)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        var paged = await loteRepository.GetControlePagedAsync(idParoquia, page, pageSize);

        // Validade mais próxima entre os itens consumidos por cada lote montado (saídas ligadas via OrigemId).
        var loteIds = paged.Items.Where(l => l.Origem == OrigemCesta.Montagem).Select(l => l.Id).ToList();
        var validades = loteIds.Count == 0
            ? new Dictionary<int, DateOnly?>()
            : await context.Movimentacoes
                .Where(m => m.OrigemTipo == OrigemMovimentacao.MontagemCesta && m.OrigemId != null
                         && loteIds.Contains(m.OrigemId.Value) && m.Validade != null)
                .GroupBy(m => m.OrigemId!.Value)
                .Select(g => new { Id = g.Key, Min = g.Min(x => x.Validade) })
                .ToDictionaryAsync(x => x.Id, x => x.Min);

        var items = paged.Items.Select(l =>
        {
            var dto = l.ToResponseDto();
            if (validades.TryGetValue(l.Id, out var v)) dto.ValidadeMaisProxima = v;
            return dto;
        });
        return new() { Items = items, TotalCount = paged.TotalCount };
    }

    public async Task<List<LoteCestaSelectDto>> GetDisponiveisSelectAsync()
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        var lotes = await loteRepository.GetDisponiveisAsync(idParoquia);
        return lotes.Select(l =>
        {
            var nome = l.Origem == OrigemCesta.Montagem
                ? l.ConfiguracaoCesta?.Nome ?? "Montagem"
                : $"Doação{(l.Doacao?.Doador?.Nome is { } d ? $" · {d}" : "")}";
            return new LoteCestaSelectDto
            {
                IdLote = l.Id,
                Disponivel = l.QuantidadeDisponivel,
                Label = $"#{l.Id} · {nome} · {l.QuantidadeDisponivel} disp.",
            };
        }).ToList();
    }
}
