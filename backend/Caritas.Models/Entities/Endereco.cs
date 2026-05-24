using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Caritas.Models.Entities;

[Table("Endereco")]
public class Endereco
{
    [Key]
    public long Id { get; set; }
    public string? Rua { get; set; }
    public string? Numero { get; set; }
    public string? Cep { get; set; }
    public string? Bairro { get; set; }
    public string? Cidade { get; set; }

    // Navegação inversa
    [JsonIgnore]
    public Paroquia? Paroquia { get; set; }
}