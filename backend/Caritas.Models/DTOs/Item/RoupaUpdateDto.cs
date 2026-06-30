using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Item;

public class RoupaUpdateDto
{
    [Required, MaxLength(200)] public string Descricao { get; set; } = string.Empty;
    [Required] public CategoriaRoupa Categoria { get; set; }
    public FaixaEtaria? FaixaEtaria { get; set; }
    public Genero? Genero { get; set; }
    [MaxLength(10)] public string? Tamanho { get; set; }
    public Estacao? Estacao { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    [MaxLength(50)] public string? Codigo { get; set; }
}
