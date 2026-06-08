namespace Caritas.Models.DTOs.Bazar;

public class PecaUpdateDto
{
    public string Categoria { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public int Quantidade { get; set; }
    public decimal Preco { get; set; }
}
