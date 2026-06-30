using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Movimentacao;

public class LinhaMovimentacaoDto
{
    [Required] public int IdItem { get; set; }
    // Tamanho do pacote (alimentos): valor + unidade (ex.: 1 "kg"). Convertido p/ unidade-base no service.
    public decimal? TamanhoValor { get; set; }
    [MaxLength(20)] public string? TamanhoUnidade { get; set; }
    public DateOnly? Validade { get; set; }
    [MaxLength(50)] public string? Lote { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
}
