using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("UsuarioParoquia")]
public class UsuarioParoquia
{
    [Key]
    public long Id { get; set; }

    public long UsuarioId { get; set; }
    public long ParoquiaId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [ForeignKey(nameof(ParoquiaId))]
    public Paroquia? Paroquia { get; set; }
}