using System.ComponentModel.DataAnnotations;
using Caritas.Models.DTOs.Movimentacao;

namespace Caritas.Models.DTOs.Doacao;

public class DoacaoCreateDto
{
    [Required] public int IdDoador { get; set; }
    [MaxLength(500)] public string? Observacao { get; set; }
    [Required, MinLength(1)] public List<LinhaMovimentacaoDto> Itens { get; set; } = [];
}
