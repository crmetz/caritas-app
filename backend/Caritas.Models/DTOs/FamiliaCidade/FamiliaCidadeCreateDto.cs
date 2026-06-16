using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.FamiliaCidade;

public class FamiliaCidadeCreateDto
{
    [Required, MaxLength(100)]
    public string Nome { get; set; } = string.Empty;
}
