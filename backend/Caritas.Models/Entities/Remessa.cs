using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class Remessa : AuditableEntity
{
    public string Nome { get; set; } = string.Empty;
    public OrigemRemessa Origem { get; set; }
    public DateTime DataChegada { get; set; }

    public ICollection<Peca> Pecas { get; set; } = [];
}
