using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Caixa;

public class CancelarLancamentoDto
{
    [Required]
    [MinLength(5)]
    public string Motivo { get; set; } = string.Empty;
}
