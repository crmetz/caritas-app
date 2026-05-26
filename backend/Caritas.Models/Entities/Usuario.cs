using Caritas.Models.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Usuario")]
public class Usuario : AuditableEntity
{
    public string? Nome { get; set; }
    public string? Sobrenome { get; set; }

    [Required]
    public string Email { get; set; } = string.Empty;

    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public DateTime? DataNasc { get; set; }

    [Required]
    public string Senha { get; set; } = string.Empty; // armazenar hash

    public int? PerfilId { get; set; }
    public bool Ativo { get; set; } = true;
    public int? UsuarioCriadorId { get; set; }
    public DateTime? DataInativacao { get; set; }

    // Auto-referência: usuário que criou este usuário
    [ForeignKey(nameof(UsuarioCriadorId))]
    public Usuario? UsuarioCriador { get; set; }

    public ICollection<Usuario> UsuariosCriados { get; set; } = new List<Usuario>();

    [ForeignKey(nameof(PerfilId))]
    public Perfil? Perfil { get; set; }
    public ICollection<UsuarioParoquia> UsuarioParoquias { get; set; } = new List<UsuarioParoquia>();
}