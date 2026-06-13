using Caritas.Models.DTOs.Atendimento;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class AtendimentoMapper
{
    public static AtendimentoResponseDto ToResponseDto(this Atendimento a) => new()
    {
        Id = a.Id,
        FamiliaId = a.FamiliaId,
        FamiliaResponsavelNome = a.Familia?.Responsavel?.Nome ?? string.Empty,
        ParoquiaId = a.ParoquiaId,
        ParoquiaNome = a.Paroquia?.Nome ?? string.Empty,
        VoluntarioId = a.VoluntarioId,
        VoluntarioNome = a.Voluntario is null
            ? string.Empty
            : $"{a.Voluntario.Nome} {a.Voluntario.Sobrenome}".Trim(),
        DataAtendimento = a.DataAtendimento,
        Relato = a.Relato,
        RendaFamiliarMomento = a.RendaFamiliarMomento,
        QtdMembrosTrabalhando = a.QtdMembrosTrabalhando,
        NecessidadesIdentificadas = a.NecessidadesIdentificadas,
        EncaminhamentosRealizados = a.EncaminhamentosRealizados,
        SituacaoGeral = a.SituacaoGeral,
        CriadoEm = a.CriadoEm,
        AtualizadoEm = a.AtualizadoEm,
    };

    public static EvolucaoPontoDto ToEvolucaoPontoDto(this Atendimento a) => new()
    {
        Data = a.DataAtendimento,
        RendaFamiliarMomento = a.RendaFamiliarMomento,
        QtdMembrosTrabalhando = a.QtdMembrosTrabalhando,
        SituacaoGeral = a.SituacaoGeral,
        Relato = a.Relato,
    };

    public static Atendimento ToEntity(this AtendimentoCreateDto dto) => new()
    {
        FamiliaId = dto.FamiliaId,
        DataAtendimento = dto.DataAtendimento,
        Relato = dto.Relato.Trim(),
        RendaFamiliarMomento = dto.RendaFamiliarMomento,
        QtdMembrosTrabalhando = dto.QtdMembrosTrabalhando,
        NecessidadesIdentificadas = string.IsNullOrWhiteSpace(dto.NecessidadesIdentificadas) ? null : dto.NecessidadesIdentificadas,
        EncaminhamentosRealizados = string.IsNullOrWhiteSpace(dto.EncaminhamentosRealizados) ? null : dto.EncaminhamentosRealizados,
        SituacaoGeral = dto.SituacaoGeral,
    };

    public static void UpdateFromDto(this Atendimento atendimento, AtendimentoUpdateDto dto)
    {
        atendimento.DataAtendimento = dto.DataAtendimento;
        atendimento.Relato = dto.Relato.Trim();
        atendimento.RendaFamiliarMomento = dto.RendaFamiliarMomento;
        atendimento.QtdMembrosTrabalhando = dto.QtdMembrosTrabalhando;
        atendimento.NecessidadesIdentificadas = string.IsNullOrWhiteSpace(dto.NecessidadesIdentificadas) ? null : dto.NecessidadesIdentificadas;
        atendimento.EncaminhamentosRealizados = string.IsNullOrWhiteSpace(dto.EncaminhamentosRealizados) ? null : dto.EncaminhamentosRealizados;
        atendimento.SituacaoGeral = dto.SituacaoGeral;
    }
}
