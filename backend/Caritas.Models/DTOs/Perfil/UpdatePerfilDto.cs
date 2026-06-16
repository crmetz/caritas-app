using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Perfil;

public class UpdatePerfilDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MaxLength(256)]
    public string Nome { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Descricao { get; set; }

    public List<string> Permissions { get; set; } = new();
}
