using Caritas.Models.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("UsuarioParoquia")]
public class UsuarioParoquia : Entity
{
    public int UsuarioId { get; set; }
    public int ParoquiaId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [ForeignKey(nameof(ParoquiaId))]
    public Paroquia? Paroquia { get; set; }
}