using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Familia;

public class FamiliaUpdateDto
{
    public int ParoquiaId { get; set; }
    public int ResponsavelId { get; set; }
    public decimal RendaFamiliar { get; set; }
    public SituacaoMoradia SituacaoMoradia { get; set; }
    public Vulnerabilidade Vulnerabilidade { get; set; }
    public string? Observacoes { get; set; }

    public string Rua { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string? Complemento { get; set; }
    public string Bairro { get; set; } = string.Empty;
    public int CidadeId { get; set; }
    public string Cep { get; set; } = string.Empty;
}
