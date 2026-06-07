namespace Caritas.Models.DTOs.Brecho;

public class PecaBrechoCreateDto
{
    public string Categoria { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public int Quantidade { get; set; }
    public decimal Preco { get; set; }
    public int ParoquiaId { get; set; }
}
