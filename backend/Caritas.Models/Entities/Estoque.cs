using Caritas.Models.Common;

namespace Caritas.Models.Entities;

// Saldo projetado do ledger. Unicidade (IdItem, IdParoquia, Tamanho, Validade, Lote).
public class Estoque : FullAuditableEntity
{
    public int IdItem { get; set; }
    public int IdParoquia { get; set; }
    public int? Tamanho { get; set; }   // tamanho do pacote em unidade-base (g/ml/un); null p/ Roupa
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public int Quantidade { get; set; }   // nº de pacotes

    public Item Item { get; set; } = null!;
    public Paroquia Paroquia { get; set; } = null!;
}
