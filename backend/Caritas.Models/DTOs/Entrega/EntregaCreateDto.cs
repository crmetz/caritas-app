using System.ComponentModel.DataAnnotations;
using Caritas.Models.DTOs.Movimentacao;

namespace Caritas.Models.DTOs.Entrega;

// Registro de uma entrega (doação de saída) a uma família. Deve conter ao menos uma linha
// (itens de alimento/roupa e/ou cestas). Itens debitam o estoque; cestas debitam um LoteCesta.
public class EntregaCreateDto
{
    [Required] public int IdFamilia { get; set; }
    public List<LinhaMovimentacaoDto> Itens { get; set; } = [];
    public List<EntregaCestaLinhaDto> Cestas { get; set; } = [];
    [MaxLength(500)] public string? Observacao { get; set; }
}

// Linha de cesta entregue: N cestas de um lote do controle.
public class EntregaCestaLinhaDto
{
    [Required] public int IdLoteCesta { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
}
