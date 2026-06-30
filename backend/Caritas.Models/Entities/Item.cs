using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public abstract class Item : FullAuditableEntity
{
    public TipoItem Tipo { get; protected set; }
    public string Descricao { get; set; } = string.Empty;
}
