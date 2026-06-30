using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Brecho;

public class FecharCaixaBrechoDto
{
    [Range(0, double.MaxValue)]
    public decimal SaldoFinalContado { get; set; }

    public string? Observacoes { get; set; }

    [Required]
    public string FechadoPor { get; set; } = string.Empty;
}
