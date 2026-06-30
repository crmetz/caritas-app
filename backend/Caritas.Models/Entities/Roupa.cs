using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class Roupa : Item
{
    public Roupa() { Tipo = TipoItem.Roupa; }

    public CategoriaRoupa Categoria { get; set; }
    public Genero? Genero { get; set; }
    public FaixaEtaria? FaixaEtaria { get; set; }
    public string? Tamanho { get; set; }   // "GG", "P", "46"... por isso string
    public Estacao? Estacao { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    public string? Codigo { get; set; }
}
