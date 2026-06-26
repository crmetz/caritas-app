using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

// Ledger append-only de baixas de cestas. Cada linha registra uma saída de N cestas de um LoteCesta
// (entregue/transferida/descartada/outro), decrementando LoteCesta.QuantidadeDisponivel.
// IdEntrega é preenchido quando Motivo=Entregue (entrega à família, header em Entrega); null nos demais motivos.
public class MovimentacaoCesta : FullAuditableEntity
{
    public int IdLoteCesta { get; set; }
    public int IdParoquia { get; set; }
    public MotivoBaixaCesta Motivo { get; set; }
    public int? IdEntrega { get; set; }
    public int Quantidade { get; set; }   // sempre > 0
    public string? Observacao { get; set; }

    public LoteCesta LoteCesta { get; set; } = null!;
}
