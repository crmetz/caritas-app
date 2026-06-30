using Caritas.Models.DTOs.Brecho;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class SessaoCaixaBrechoService(CaritasDbContext context)
{
    public async Task<SessaoCaixaBrechoResponseDto?> GetSessaoAtualAsync(int paroquiaId)
    {
        var sessao = await context.SessoesCaixaBrecho
            .Where(s => s.ParoquiaId == paroquiaId && s.Aberto)
            .OrderByDescending(s => s.AbertoEm)
            .FirstOrDefaultAsync();

        return sessao is null ? null : MapSessao(sessao);
    }

    public async Task<SessaoCaixaBrechoResponseDto?> GetSessaoRecenteAsync(int paroquiaId)
    {
        var sessao = await context.SessoesCaixaBrecho
            .Where(s => s.ParoquiaId == paroquiaId)
            .OrderByDescending(s => s.AbertoEm)
            .FirstOrDefaultAsync();

        return sessao is null ? null : MapSessao(sessao);
    }

    public async Task<SessaoCaixaBrechoResponseDto> AbrirCaixaAsync(AbrirCaixaBrechoDto dto)
    {
        var jaAberto = await context.SessoesCaixaBrecho
            .AnyAsync(s => s.ParoquiaId == dto.ParoquiaId && s.Aberto);

        if (jaAberto)
            throw new InvalidOperationException("Já existe um caixa aberto para esta paróquia.");

        var sessao = new SessaoCaixaBrecho
        {
            ParoquiaId = dto.ParoquiaId,
            AbertoPor = dto.AbertoPor,
            AbertoEm = DateTime.UtcNow,
            Aberto = true,
        };

        await context.SessoesCaixaBrecho.AddAsync(sessao);
        await context.SaveChangesAsync();
        return MapSessao(sessao);
    }

    public async Task<SessaoCaixaBrechoResponseDto> FecharCaixaAsync(int id, FecharCaixaBrechoDto dto)
    {
        var sessao = await context.SessoesCaixaBrecho
            .FirstOrDefaultAsync(s => s.Id == id && s.Aberto)
            ?? throw new KeyNotFoundException($"Sessão com id {id} não encontrada ou já fechada.");

        var totalVendas = await context.VendasBrecho
            .Where(v => v.ParoquiaId == sessao.ParoquiaId
                     && !v.Cancelado
                     && v.DataVenda >= sessao.AbertoEm)
            .SumAsync(v => (decimal?)v.ValorTotal) ?? 0;

        var saldoCalculado = sessao.SaldoInicial + totalVendas;

        sessao.Aberto = false;
        sessao.FechadoPor = dto.FechadoPor;
        sessao.FechadoEm = DateTime.UtcNow;
        sessao.SaldoFinalContado = dto.SaldoFinalContado;
        sessao.SaldoFinalCalculado = saldoCalculado;
        sessao.Diferenca = dto.SaldoFinalContado - saldoCalculado;
        sessao.Observacoes = dto.Observacoes;

        await context.SaveChangesAsync();
        return MapSessao(sessao);
    }

    private static SessaoCaixaBrechoResponseDto MapSessao(SessaoCaixaBrecho s) => new()
    {
        Id = s.Id,
        ParoquiaId = s.ParoquiaId,
        AbertoPor = s.AbertoPor,
        FechadoPor = s.FechadoPor,
        AbertoEm = s.AbertoEm,
        FechadoEm = s.FechadoEm,
        SaldoInicial = s.SaldoInicial,
        SaldoFinalContado = s.SaldoFinalContado,
        SaldoFinalCalculado = s.SaldoFinalCalculado,
        Diferenca = s.Diferenca,
        Observacoes = s.Observacoes,
        Aberto = s.Aberto,
    };
}
