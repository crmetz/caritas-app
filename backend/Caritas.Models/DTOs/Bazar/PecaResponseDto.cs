namespace Caritas.Models.DTOs.Bazar;

public class PecaResponseDto
{
    public int Id { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public int Quantidade { get; set; }
    public decimal Preco { get; set; }
    public int? ParoquiaId { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
