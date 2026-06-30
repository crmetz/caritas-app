using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Estoque;

public class EstoqueRoupaResponseDto
{
    public int Id { get; set; }
    public int IdItem { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public CategoriaRoupa Categoria { get; set; }
    public string? Tamanho { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    public string? Lote { get; set; }
    public int Quantidade { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
