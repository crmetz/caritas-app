using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Perfil")]
public class Perfil
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Nome { get; set; } = string.Empty;

    public bool Ativo { get; set; } = true;

    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();

    public ICollection<PerfilPermissao> PerfilPermissoes { get; set; } = new List<PerfilPermissao>();
}