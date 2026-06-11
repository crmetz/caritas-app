using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.DTOs.Usuario;

public class UsuarioPagedRequestDto : PagedRequestDto
{
    public string? SearchTerm { get; set; }
}
