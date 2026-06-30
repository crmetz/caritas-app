using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class MovimentacaoEstoque : FullAuditableEntity
{
    public int IdItem { get; set; }
    public int IdParoquia { get; set; }
    public int? Tamanho { get; set; }   // tamanho do pacote em unidade-base (g/ml/un)
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public TipoOperacao TipoOperacao { get; set; }
    public int Quantidade { get; set; }              // sempre > 0; o sinal vem de TipoOperacao
    public OrigemMovimentacao OrigemTipo { get; set; }
    public int? OrigemId { get; set; }               // ref. polimórfica, sem FK
    public string? Observacao { get; set; }

    public Item Item { get; set; } = null!;
}
