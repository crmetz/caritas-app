using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Atendimento;

public class AtendimentoUpdateDto
{
    /// <summary>Opcional. Se não informado, mantém/assume o usuário autenticado.</summary>
    public int? VoluntarioId { get; set; }

    public DateOnly DataAtendimento { get; set; }
    public string Relato { get; set; } = string.Empty;
    public decimal? RendaFamiliarMomento { get; set; }
    public int? QtdMembrosTrabalhando { get; set; }
    public string? NecessidadesIdentificadas { get; set; }
    public string? EncaminhamentosRealizados { get; set; }
    public SituacaoGeralFamilia? SituacaoGeral { get; set; }
}
