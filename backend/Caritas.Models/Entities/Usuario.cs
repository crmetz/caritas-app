using Caritas.Models.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace Caritas.Models.Entities;

[Table("Usuario")]
public class Usuario : IdentityUser<int>
{
    public string? Nome { get; set; }
    public string? Sobrenome { get; set; }
    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public DateOnly? DataNasc { get; set; }
    public int? PerfilId { get; set; }
    public bool Ativo { get; set; } = true;
    public int? UsuarioCriadorId { get; set; }
    public DateTime? DataInativacao { get; set; }

    // Auto-referência: usuário que criou este usuário
    [ForeignKey(nameof(UsuarioCriadorId))]
    public Usuario? UsuarioCriador { get; set; }

    public ICollection<Usuario> UsuariosCriados { get; set; } = new List<Usuario>();
    public List<int>? ParoquiasPermitidas {get;set;}

    [ForeignKey(nameof(PerfilId))]
    public Perfil? Perfil { get; set; }
    public ICollection<UsuarioParoquia> UsuarioParoquias { get; set; } = new List<UsuarioParoquia>();

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}