using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Brecho;

public class CancelarVendaBrechoDto
{
    [Required]
    [MinLength(5)]
    public string Motivo { get; set; } = string.Empty;

    [Required]
    public string CanceladoPor { get; set; } = string.Empty;
}
