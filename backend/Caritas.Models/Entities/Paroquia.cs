using Caritas.Models.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Paroquia")]
public class Paroquia : AuditableEntity
{
    [Required]
    public string Nome { get; set; } = string.Empty;

    public bool Raiz { get; set; }

    public bool Ativa { get; set; } = true;

    public int? EnderecoId { get; set; }

    [ForeignKey(nameof(EnderecoId))]
    public Endereco? Endereco { get; set; }

    // Navegação many-to-many
    public ICollection<UsuarioParoquia> UsuarioParoquias { get; set; } = new List<UsuarioParoquia>();
}