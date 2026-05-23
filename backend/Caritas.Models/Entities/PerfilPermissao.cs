using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("PerfilPermissao")]
public class PerfilPermissao
{
    [Key]
    public long Id { get; set; }

    public long PerfilId { get; set; }
    public long PermissaoId { get; set; }
    public bool Ativa { get; set; } = true;

    [ForeignKey(nameof(PerfilId))]
    public Perfil? Perfil { get; set; }

    [ForeignKey(nameof(PermissaoId))]
    public Permissao? Permissao { get; set; }
}