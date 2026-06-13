using Caritas.Models.DTOs.Common;

namespace Caritas.Models.DTOs.Perfil;

public class PerfilDto : EntityDto
{
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Estatico { get; set; }
    public List<string> Permissions { get; set; } = new();
}
