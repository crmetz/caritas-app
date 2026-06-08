using Caritas.Models.Common;

namespace Caritas.Models.Entities;

public class ItemVendaBrecho : AuditableEntity
{
    public int VendaBrechoId { get; set; }
    public VendaBrecho VendaBrecho { get; set; } = null!;

    public int PecaId { get; set; }
    public Peca Peca { get; set; } = null!;

    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
}
