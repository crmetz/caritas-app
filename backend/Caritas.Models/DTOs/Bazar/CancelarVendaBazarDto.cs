using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Bazar;

public class CancelarVendaBazarDto
{
    [Required]
    public string Motivo { get; set; } = string.Empty;

    [Required]
    public string CanceladoPor { get; set; } = string.Empty;
}
