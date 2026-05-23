using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Usuario")]
public class Usuario
{
    [Key]
    public int Id { get; set; }

    public string? Nome { get; set; }

    public string? Sobrenome { get; set; }

    [Required]
    public string Senha { get; set; } = string.Empty;

    [Required]
    public string Email { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string? DataNascimento { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime? DataCriacao { get; set; }

    public DateTime? DataInativacao { get; set; }

    public int? IdCriador { get; set; }

    public int? IdParoquia { get; set; }

    public int? IdPerfil { get; set; }

    [ForeignKey(nameof(IdCriador))]
    public Usuario? Criador { get; set; }

    public ICollection<Usuario> UsuariosCriados { get; set; } = new List<Usuario>();

    [ForeignKey(nameof(IdParoquia))]
    public Paroquia? Paroquia { get; set; }

    [ForeignKey(nameof(IdPerfil))]
    public Perfil? Perfil { get; set; }
}