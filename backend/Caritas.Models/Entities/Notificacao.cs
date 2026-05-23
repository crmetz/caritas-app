using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Notificacao")]
public class Notificacao
{
    [Key]
    public int Id { get; set; }

    public string? Titulo { get; set; }

    public string? Mensagem { get; set; }

    public TipoDestinatario? TipoDestinatario { get; set; }

    public int? IdParoquiaEmissora { get; set; }
    
    [ForeignKey(nameof(IdParoquiaEmissora))]
    public Paroquia? ParoquiaEmissora { get; set; }
}