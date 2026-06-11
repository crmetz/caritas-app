using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Familia;

public class FamiliaFilterDto
{
    public int? ParoquiaId { get; set; }
    public string? ResponsavelNome { get; set; }
    public SituacaoMoradia? SituacaoMoradia { get; set; }
    public int? CidadeId { get; set; }
    public string? Bairro { get; set; }
}
