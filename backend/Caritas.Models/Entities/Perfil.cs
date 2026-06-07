using Caritas.Models.Common;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Perfil")]
public class Perfil : IdentityRole<int>
{
    public string Descricao { get; set; }
    public bool Estatico { get; set; }
    public int? PerfilPaiId { get; set; }

    [ForeignKey(nameof(PerfilPaiId))]
    public Perfil? PerfilPai { get; set; }

    public ICollection<Perfil> SubPerfis { get; set; } = new List<Perfil>();

    // Navegações
    // O vínculo usuário↔perfil é gerenciado pelo Identity via AspNetUserRoles.
    public ICollection<PerfilPermissao> PerfilPermissoes { get; set; } = new List<PerfilPermissao>();
}