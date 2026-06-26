using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Item;

public class AlimentoCreateDto
{
    // Nome do gênero (ex.: "Arroz").
    [Required, MaxLength(200)]
    public string Descricao { get; set; } = string.Empty;

    [Required]
    public FormaMedida FormaMedida { get; set; }
}
