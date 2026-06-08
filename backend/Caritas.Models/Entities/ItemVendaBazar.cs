using Caritas.Models.Common;

namespace Caritas.Models.Entities;

public class ItemVendaBazar : AuditableEntity
{
    public int VendaBazarId { get; set; }
    public VendaBazar VendaBazar { get; set; } = null!;

    public int PecaId { get; set; }
    public Peca Peca { get; set; } = null!;

    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
}
