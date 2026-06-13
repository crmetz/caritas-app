using Caritas.Models.DTOs.Atendimento;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class AtendimentoService(CaritasDbContext context)
{
    private readonly AtendimentoRepository _atendimentoRepository = new(context);

    public async Task<PagedResponseDto<AtendimentoResponseDto>> GetPagedAsync(int page, int pageSize, AtendimentoFilterDto filter)
    {
        var paged = await _atendimentoRepository.GetPagedAsync(page, pageSize, filter);
        return new PagedResponseDto<AtendimentoResponseDto>
        {
            Items = paged.Items.Select(a => a.ToResponseDto()),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task<AtendimentoResponseDto> GetByIdAsync(int id)
    {
        var atendimento = await _atendimentoRepository.GetByIdWithRelacionamentosAsync(id)
            ?? throw new KeyNotFoundException($"Atendimento com id {id} não encontrado.");
        return atendimento.ToResponseDto();
    }

    public async Task<AtendimentoResponseDto> CreateAsync(AtendimentoCreateDto dto, int usuarioLogadoId, int paroquiaAtualId)
    {
        var familia = await context.Familias.FirstOrDefaultAsync(f => f.Id == dto.FamiliaId)
            ?? throw new KeyNotFoundException($"Família com id {dto.FamiliaId} não encontrada.");

        if (familia.ParoquiaId != paroquiaAtualId)
            throw new InvalidOperationException("A família não pertence à paróquia atual.");

        var voluntarioId = await ResolverVoluntarioAsync(dto.VoluntarioId, usuarioLogadoId, paroquiaAtualId);

        var atendimento = dto.ToEntity();
        atendimento.ParoquiaId = paroquiaAtualId;
        atendimento.VoluntarioId = voluntarioId;

        await context.Atendimentos.AddAsync(atendimento);
        await context.SaveChangesAsync();

        return await GetByIdAsync(atendimento.Id);
    }

    public async Task<AtendimentoResponseDto> UpdateAsync(int id, AtendimentoUpdateDto dto, int usuarioLogadoId)
    {
        var atendimento = await _atendimentoRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Atendimento com id {id} não encontrado.");

        var voluntarioId = await ResolverVoluntarioAsync(dto.VoluntarioId, usuarioLogadoId, atendimento.ParoquiaId);

        atendimento.UpdateFromDto(dto);
        atendimento.VoluntarioId = voluntarioId;

        await _atendimentoRepository.UpdateAsync(atendimento);
        return await GetByIdAsync(atendimento.Id);
    }

    public async Task DeleteAsync(int id)
        => await _atendimentoRepository.DeleteAsync(id);

    public async Task<EvolucaoFamiliaDto> GetEvolucaoAsync(int familiaId, int paroquiaAtualId)
    {
        var familia = await context.Familias
            .Include(f => f.Responsavel)
            .FirstOrDefaultAsync(f => f.Id == familiaId)
            ?? throw new KeyNotFoundException($"Família com id {familiaId} não encontrada.");

        if (familia.ParoquiaId != paroquiaAtualId)
            throw new InvalidOperationException("A família não pertence à paróquia atual.");

        var atendimentos = await _atendimentoRepository.GetByFamiliaOrderedAsync(familiaId);
        var pontos = atendimentos.Select(a => a.ToEvolucaoPontoDto()).ToList();

        var rendaInicial = pontos.FirstOrDefault(p => p.RendaFamiliarMomento != null)?.RendaFamiliarMomento;
        var rendaAtual = pontos.LastOrDefault(p => p.RendaFamiliarMomento != null)?.RendaFamiliarMomento;

        return new EvolucaoFamiliaDto
        {
            FamiliaId = familia.Id,
            FamiliaResponsavelNome = familia.Responsavel?.Nome ?? $"Família #{familia.Id}",
            TotalAtendimentos = atendimentos.Count,
            PrimeiroAtendimento = pontos.Count > 0 ? pontos[0].Data : null,
            UltimoAtendimento = pontos.Count > 0 ? pontos[^1].Data : null,
            SituacaoAtual = atendimentos.LastOrDefault()?.SituacaoGeral,
            RendaInicial = rendaInicial,
            RendaAtual = rendaAtual,
            VariacaoRenda = rendaInicial != null && rendaAtual != null ? rendaAtual - rendaInicial : null,
            Pontos = pontos,
        };
    }

    public async Task<EvolucaoParoquiaDto> GetEvolucaoParoquiaAsync(int paroquiaAtualId)
    {
        var atendimentos = await _atendimentoRepository.GetByParoquiaOrderedAsync(paroquiaAtualId);
        if (atendimentos.Count == 0)
            return new EvolucaoParoquiaDto();

        var porFamilia = atendimentos
            .GroupBy(a => a.FamiliaId)
            .ToDictionary(g => g.Key, g => g.OrderBy(a => a.DataAtendimento).ThenBy(a => a.CriadoEm).ToList());

        // Distribuição atual: situação do último atendimento de cada família.
        var distribuicaoAtual = porFamilia.Values
            .Select(lista => lista[^1].SituacaoGeral)
            .GroupBy(s => s)
            .Select(g => new SituacaoContagemDto { Situacao = g.Key, Quantidade = g.Count() })
            .OrderByDescending(c => c.Quantidade)
            .ToList();

        // Série mensal: situação vigente de cada família até o fim de cada mês.
        var primeira = atendimentos[0].DataAtendimento;
        var ultima = atendimentos[^1].DataAtendimento;
        var cursor = new DateOnly(primeira.Year, primeira.Month, 1);
        var fim = new DateOnly(ultima.Year, ultima.Month, 1);

        var serie = new List<EvolucaoParoquiaPontoDto>();
        while (cursor <= fim)
        {
            var fimDoMes = cursor.AddMonths(1).AddDays(-1);
            var ponto = new EvolucaoParoquiaPontoDto { Periodo = cursor.ToString("yyyy-MM") };

            foreach (var lista in porFamilia.Values)
            {
                var vigente = lista.LastOrDefault(a => a.DataAtendimento <= fimDoMes);
                switch (vigente?.SituacaoGeral)
                {
                    case SituacaoGeralFamilia.Critica: ponto.Critica++; break;
                    case SituacaoGeralFamilia.Estavel: ponto.Estavel++; break;
                    case SituacaoGeralFamilia.EmEvolucao: ponto.EmEvolucao++; break;
                    case SituacaoGeralFamilia.Superada: ponto.Superada++; break;
                }
            }

            serie.Add(ponto);
            cursor = cursor.AddMonths(1);
        }

        return new EvolucaoParoquiaDto
        {
            TotalFamiliasComAtendimento = porFamilia.Count,
            DistribuicaoAtual = distribuicaoAtual,
            Serie = serie,
        };
    }

    /// <summary>
    /// Resolve o voluntário do atendimento. Sem id informado, assume o usuário logado.
    /// Ao escolher outro usuário, valida que ele pertence à paróquia.
    /// </summary>
    private async Task<int> ResolverVoluntarioAsync(int? voluntarioIdInformado, int usuarioLogadoId, int paroquiaId)
    {
        var voluntarioId = voluntarioIdInformado ?? usuarioLogadoId;

        if (voluntarioId == usuarioLogadoId)
            return voluntarioId;

        var pertenceAParoquia = await context.UsuarioParoquias
            .AnyAsync(up => up.UsuarioId == voluntarioId && up.ParoquiaId == paroquiaId);

        if (!pertenceAParoquia)
            throw new ArgumentException("O voluntário selecionado não pertence à paróquia atual.");

        return voluntarioId;
    }
}
