using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("PerfilPermissao")]
public class PerfilPermissao
{
    [Key]
    public int Id { get; set; }

    public int? IdPerfil { get; set; }

    public int? IdPermissao { get; set; }

    public bool Ativo { get; set; } = true;

    // Navegações
    [ForeignKey(nameof(IdPerfil))]
    public Perfil? Perfil { get; set; }

    [ForeignKey(nameof(IdPermissao))]
    public Permissao? Permissao { get; set; }
}