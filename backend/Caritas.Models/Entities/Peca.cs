using Caritas.Models.Common;

namespace Caritas.Models.Entities;

public class Peca : AuditableEntity
{
    public string Categoria { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public int Quantidade { get; set; }
    public decimal Preco { get; set; }

    // Bazar: remessa opcional
    public int? RemessaId { get; set; }
    public Remessa? Remessa { get; set; }

    // Brechó: paróquia obrigatória quando é peça de brechó
    public int? ParoquiaId { get; set; }
    public Paroquia? Paroquia { get; set; }
}
