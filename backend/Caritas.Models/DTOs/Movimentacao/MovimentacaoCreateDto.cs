using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Movimentacao;

public class MovimentacaoCreateDto
{
    [Required] public int IdItem { get; set; }
    // Tamanho do pacote (alimentos): valor + unidade (ex.: 1 "kg"); convertido p/ base no service.
    public decimal? TamanhoValor { get; set; }
    [MaxLength(20)] public string? TamanhoUnidade { get; set; }
    public DateOnly? Validade { get; set; }
    [MaxLength(50)] public string? Lote { get; set; }
    [Required] public TipoOperacao TipoOperacao { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
    [Required] public OrigemMovimentacao OrigemTipo { get; set; }
    public int? OrigemId { get; set; }
    [MaxLength(500)] public string? Observacao { get; set; }
}
