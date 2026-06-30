namespace Caritas.Models.DTOs.Entrega;

public class EntregaResponseDto
{
    public int Id { get; set; }
    public int IdFamilia { get; set; }
    public int IdParoquia { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}
