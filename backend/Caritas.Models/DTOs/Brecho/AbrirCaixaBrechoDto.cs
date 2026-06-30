using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Brecho;

public class AbrirCaixaBrechoDto
{
    public int ParoquiaId { get; set; }

    [Required]
    public string AbertoPor { get; set; } = string.Empty;
}
