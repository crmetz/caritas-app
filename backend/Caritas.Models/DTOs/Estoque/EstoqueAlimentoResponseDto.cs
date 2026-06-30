using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Estoque;

public class EstoqueAlimentoResponseDto
{
    public int Id { get; set; }
    public int IdItem { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public FormaMedida FormaMedida { get; set; }
    public int? Tamanho { get; set; }                  // unidade-base
    public string? TamanhoFormatado { get; set; }      // ex.: "1 kg"
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public int Quantidade { get; set; }                // nº de pacotes
    public DateTime AtualizadoEm { get; set; }
}
