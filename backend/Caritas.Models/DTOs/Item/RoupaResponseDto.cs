using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Item;

public class RoupaResponseDto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public CategoriaRoupa Categoria { get; set; }
    public FaixaEtaria? FaixaEtaria { get; set; }
    public Genero? Genero { get; set; }
    public string? Tamanho { get; set; }
    public Estacao? Estacao { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    public string? Codigo { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
