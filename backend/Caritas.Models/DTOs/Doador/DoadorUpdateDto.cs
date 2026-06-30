using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Doador;

public class DoadorUpdateDto
{
    [Required, MaxLength(150)] public string Nome { get; set; } = string.Empty;
    [MaxLength(20)] public string? Documento { get; set; }
    [MaxLength(20)] public string? Telefone { get; set; }
}
