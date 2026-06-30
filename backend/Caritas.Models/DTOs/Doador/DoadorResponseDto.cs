namespace Caritas.Models.DTOs.Doador;

public class DoadorResponseDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Documento { get; set; }
    public string? Telefone { get; set; }
}
