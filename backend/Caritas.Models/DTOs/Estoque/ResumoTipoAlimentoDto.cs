using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Estoque;

// Total de um gênero alimentício no estoque, na unidade mais legível.
public class ResumoTipoAlimentoDto
{
    public int IdAlimento { get; set; }
    public string Nome { get; set; } = string.Empty;
    public FormaMedida FormaMedida { get; set; }
    public long TotalBase { get; set; }                // Σ(quantidade × tamanho) em unidade-base
    public string TextoFormatado { get; set; } = string.Empty;   // ex.: "8 kg"
}
