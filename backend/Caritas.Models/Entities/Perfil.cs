using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Perfil")]
public class Perfil
{
    [Key]
    public long Id { get; set; }

    [Required]
    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public long? PerfilPaiId { get; set; }

    [ForeignKey(nameof(PerfilPaiId))]
    public Perfil? PerfilPai { get; set; }

    public ICollection<Perfil> SubPerfis { get; set; } = new List<Perfil>();

    // Navegações
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<PerfilPermissao> PerfilPermissoes { get; set; } = new List<PerfilPermissao>();
}