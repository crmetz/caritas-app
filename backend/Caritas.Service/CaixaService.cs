using Caritas.Models.DTOs.Caixa;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class CaixaService(CaritasDbContext context)
{
    public async Task<PagedResponseDto<LancamentoCaixaResponseDto>> GetLancamentosAsync(
        int paroquiaId, int page, int pageSize)
    {
        var paged = await context.LancamentosCaixa
            .Include(l => l.Familia).ThenInclude(f => f!.Responsavel)
            .Where(l => l.ParoquiaId == paroquiaId)
            .OrderByDescending(l => l.Data)
            .ToPagedAsync(page, pageSize);

        return new PagedResponseDto<LancamentoCaixaResponseDto>
        {
            Items = paged.Items.Select(MapLancamento),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task<LancamentoCaixaResponseDto> CreateEntradaAsync(CreateEntradaDto dto)
    {
        if (dto.Origem == OrigemEntrada.VendaBrecho)
            throw new ArgumentException("Entradas do Brechó são geradas automaticamente.");

        var lancamento = new LancamentoCaixa
        {
            ParoquiaId = dto.ParoquiaId,
            Data = DateTime.SpecifyKind(dto.Data, DateTimeKind.Utc),
            Tipo = TipoLancamento.Entrada,
            Valor = dto.Valor,
            Origem = dto.Origem,
            Responsavel = dto.Responsavel,
            GeradoAutomaticamente = false,
            Observacoes = dto.Observacoes,
        };

        await context.LancamentosCaixa.AddAsync(lancamento);
        await context.SaveChangesAsync();
        return MapLancamento(lancamento);
    }

    public async Task<LancamentoCaixaResponseDto> CreateSaidaAsync(CreateSaidaDto dto)
    {
        var lancamento = new LancamentoCaixa
        {
            ParoquiaId = dto.ParoquiaId,
            Data = DateTime.SpecifyKind(dto.Data, DateTimeKind.Utc),
            Tipo = TipoLancamento.Saida,
            Valor = dto.Valor,
            Destino = dto.Destino,
            FamiliaId = dto.FamiliaId,
            Responsavel = dto.Responsavel,
            GeradoAutomaticamente = false,
            Observacoes = dto.Observacoes,
        };

        await context.LancamentosCaixa.AddAsync(lancamento);
        await context.SaveChangesAsync();

        if (dto.FamiliaId.HasValue)
            await context.Entry(lancamento)
                .Reference(l => l.Familia)
                .Query()
                .Include(f => f!.Responsavel)
                .LoadAsync();

        return MapLancamento(lancamento);
    }

    public async Task CancelarLancamentoAsync(int id, CancelarLancamentoDto dto)
    {
        var lancamento = await context.LancamentosCaixa.FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new KeyNotFoundException($"Lançamento com id {id} não encontrado.");

        if (lancamento.GeradoAutomaticamente)
            throw new InvalidOperationException("Lançamentos gerados automaticamente não podem ser cancelados.");

        if (lancamento.Cancelado)
            throw new InvalidOperationException("Este lançamento já foi cancelado.");

        lancamento.Cancelado = true;
        lancamento.CanceladoEm = DateTime.UtcNow;
        lancamento.MotivoCancelamento = dto.Motivo;

        var tipoEstorno = lancamento.Tipo == TipoLancamento.Entrada
            ? TipoLancamento.Saida
            : TipoLancamento.Entrada;

        var estorno = new LancamentoCaixa
        {
            ParoquiaId = lancamento.ParoquiaId,
            Data = DateTime.UtcNow,
            Tipo = tipoEstorno,
            Valor = lancamento.Valor,
            GeradoAutomaticamente = true,
            Responsavel = "Estorno",
            Observacoes = $"Cancelamento do lançamento #{lancamento.Id}: {dto.Motivo}",
        };

        await context.LancamentosCaixa.AddAsync(estorno);
        await context.SaveChangesAsync();
    }

    public async Task<RelatorioCaixaDto> GetRelatorioAsync(int paroquiaId, DateTime dataInicio, DateTime dataFim)
    {
        dataInicio = DateTime.SpecifyKind(dataInicio, DateTimeKind.Utc);
        dataFim = DateTime.SpecifyKind(dataFim.AddDays(1), DateTimeKind.Utc);

        var lancamentos = await context.LancamentosCaixa
            .Include(l => l.Familia).ThenInclude(f => f!.Responsavel)
            .Where(l => l.ParoquiaId == paroquiaId
                     && l.Data >= dataInicio
                     && l.Data < dataFim)
            .ToListAsync();

        var entradas = lancamentos.Where(l => l.Tipo == TipoLancamento.Entrada).ToList();
        var saidas = lancamentos.Where(l => l.Tipo == TipoLancamento.Saida).ToList();

        var entradasPorOrigem = entradas
            .Where(l => l.Origem.HasValue)
            .GroupBy(l => l.Origem!.Value)
            .Select(g => new EntradaPorOrigemDto { Origem = g.Key, Total = g.Sum(l => l.Valor) });

        var saidasPorDestino = saidas
            .Where(l => l.Destino.HasValue)
            .GroupBy(l => l.Destino!.Value)
            .Select(g => new SaidaPorDestinoDto { Destino = g.Key, Total = g.Sum(l => l.Valor) });

        var familiasBeneficiadas = saidas
            .Where(l => l.Familia != null)
            .GroupBy(l => l.FamiliaId)
            .Select(g => new FamiliaBeneficiadaDto
            {
                Familia = g.First().Familia!.Responsavel.Nome,
                Total = g.Sum(l => l.Valor),
            })
            .OrderByDescending(f => f.Total);

        return new RelatorioCaixaDto
        {
            TotalEntradas = entradas.Sum(l => l.Valor),
            TotalSaidas = saidas.Sum(l => l.Valor),
            EntradasPorOrigem = entradasPorOrigem,
            SaidasPorDestino = saidasPorDestino,
            FamiliasBeneficiadas = familiasBeneficiadas,
        };
    }

    private static LancamentoCaixaResponseDto MapLancamento(LancamentoCaixa l) => new()
    {
        Id = l.Id,
        ParoquiaId = l.ParoquiaId,
        Data = l.Data,
        Tipo = l.Tipo,
        Valor = l.Valor,
        Origem = l.Origem,
        Destino = l.Destino,
        FamiliaId = l.FamiliaId,
        Familia = l.Familia is not null
            ? new FamiliaResumoDto { Id = l.Familia.Id, NomeResponsavel = l.Familia.Responsavel.Nome }
            : null,
        Responsavel = l.Responsavel,
        GeradoAutomaticamente = l.GeradoAutomaticamente,
        Observacoes = l.Observacoes,
        Cancelado = l.Cancelado,
        CanceladoEm = l.CanceladoEm,
        MotivoCancelamento = l.MotivoCancelamento,
        CriadoEm = l.CriadoEm,
        AtualizadoEm = l.AtualizadoEm,
    };
}
