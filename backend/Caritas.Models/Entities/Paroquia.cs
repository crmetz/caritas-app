using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Paroquia")]
public class Paroquia
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Nome { get; set; } = string.Empty;

    public int? IdEndereco { get; set; }

    [ForeignKey(nameof(IdEndereco))]
    public Endereco? Endereco { get; set; }

    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();

    public ICollection<Notificacao> Notificacoes { get; set; } = new List<Notificacao>();
}