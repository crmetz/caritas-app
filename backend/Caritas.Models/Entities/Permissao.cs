using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Permissao")]
public class Permissao
{
    [Key]
    public long Id { get; set; }

    public string? Codigo { get; set; }

    public ICollection<PerfilPermissao> PerfilPermissoes { get; set; } = new List<PerfilPermissao>();
}