namespace Caritas.Models.Common;

// Adiciona userstamps sobre os timestamps de AuditableEntity.
// Carimbados automaticamente no CaritasDbContext.SaveChangesAsync via ICurrentSession.
public class FullAuditableEntity : AuditableEntity
{
    public int? CriadoPor { get; set; }
    public int? AtualizadoPor { get; set; }
}
