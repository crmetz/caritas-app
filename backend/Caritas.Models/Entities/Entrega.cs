using Caritas.Models.Common;

namespace Caritas.Models.Entities;

// Registro único de entrega (doação de saída) a uma família. Cabeçalho do evento; o conteúdo são as
// linhas nos dois ledgers:
//  - Alimentos/Roupas: MovimentacaoEstoque (Saida, OrigemTipo=Entrega, OrigemId=Entrega.Id).
//  - Cestas: MovimentacaoCesta (Motivo=Entregue, IdEntrega=Entrega.Id), decrementando LoteCesta.
public class Entrega : FullAuditableEntity
{
    public int IdParoquia { get; set; }
    public int IdFamilia { get; set; }
    public string? Observacao { get; set; }

    public Familia Familia { get; set; } = null!;
    public Paroquia Paroquia { get; set; } = null!;
}
