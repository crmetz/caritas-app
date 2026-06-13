using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Atendimento;

public class AtendimentoFilterDto
{
    public int? FamiliaId { get; set; }
    public int? ParoquiaId { get; set; }
    public int? VoluntarioId { get; set; }
    public SituacaoGeralFamilia? SituacaoGeral { get; set; }
    public DateOnly? DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
}
