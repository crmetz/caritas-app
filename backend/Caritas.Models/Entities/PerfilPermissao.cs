using Caritas.Models.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("PerfilPermissao")]
public class PerfilPermissao : Entity
{
    public int PerfilId { get; set; }
    public int PermissaoId { get; set; }
    public bool Ativa { get; set; } = true;

    [ForeignKey(nameof(PerfilId))]
    public Perfil? Perfil { get; set; }

    [ForeignKey(nameof(PermissaoId))]
    public Permissao? Permissao { get; set; }
}