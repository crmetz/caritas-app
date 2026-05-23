using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Paroquia")]
public class Paroquia
{
    [Key]
    public long Id { get; set; }

    [Required]
    public string Nome { get; set; } = string.Empty;

    public long? EnderecoId { get; set; }

    [ForeignKey(nameof(EnderecoId))]
    public Endereco? Endereco { get; set; }

    // Navegação many-to-many
    public ICollection<UsuarioParoquia> UsuarioParoquias { get; set; } = new List<UsuarioParoquia>();
}