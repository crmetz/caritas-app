using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

[Table("Endereco")]
public class Endereco
{
    [Key]
    public int Id { get; set; }

    public string? Rua { get; set; }

    public string? Numero { get; set; }

    public string? Cep { get; set; }

    public string? Bairro { get; set; }

    public string? Cidade { get; set; }

    public Paroquia? Paroquia { get; set; }
}