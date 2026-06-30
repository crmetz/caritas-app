using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Item;

public class AlimentoUpdateDto
{
    [Required, MaxLength(200)]
    public string Descricao { get; set; } = string.Empty;

    [Required]
    public FormaMedida FormaMedida { get; set; }
}
