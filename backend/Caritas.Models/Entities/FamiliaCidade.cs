using Caritas.Models.Common;
using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.Entities;

public class FamiliaCidade : AuditableEntity
{
    [Required, MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    public ICollection<Familia> Familias { get; set; } = [];
}
