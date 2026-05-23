using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Usuario")]
public class Usuario
{
    [Key]
    public long Id { get; set; }

    public string? Nome { get; set; }
    public string? Sobrenome { get; set; }

    [Required]
    public string Email { get; set; } = string.Empty;

    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public DateTime? DataNasc { get; set; }

    [Required]
    public string Senha { get; set; } = string.Empty; // armazenar hash

    public long? PerfilId { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public long? UsuarioCriadorId { get; set; }
    public DateTime? DataInativacao { get; set; }

    // Auto-referência: usuário que criou este usuário
    [ForeignKey(nameof(UsuarioCriadorId))]
    public Usuario? UsuarioCriador { get; set; }

    public ICollection<Usuario> UsuariosCriados { get; set; } = new List<Usuario>();

    [ForeignKey(nameof(PerfilId))]
    public Perfil? Perfil { get; set; }

    // Navegação many-to-many
    public ICollection<UsuarioParoquia> UsuarioParoquias { get; set; } = new List<UsuarioParoquia>();
}