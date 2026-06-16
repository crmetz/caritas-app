using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Atendimento;

public class AtendimentoResponseDto
{
    public int Id { get; set; }

    public int FamiliaId { get; set; }
    public string FamiliaResponsavelNome { get; set; } = string.Empty;

    public int ParoquiaId { get; set; }
    public string ParoquiaNome { get; set; } = string.Empty;

    public int VoluntarioId { get; set; }
    public string VoluntarioNome { get; set; } = string.Empty;

    public DateOnly DataAtendimento { get; set; }
    public string Relato { get; set; } = string.Empty;
    public decimal? RendaFamiliarMomento { get; set; }
    public int? QtdMembrosTrabalhando { get; set; }
    public string? NecessidadesIdentificadas { get; set; }
    public string? EncaminhamentosRealizados { get; set; }
    public SituacaoGeralFamilia? SituacaoGeral { get; set; }

    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
