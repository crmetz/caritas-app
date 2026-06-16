using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.DTOs.Paroquia;

public class ParoquiaPagedRequestDto : PagedRequestDto
{
    public string? Nome { get; set; }
    public string? Cidade { get; set; }
    public string? Bairro { get; set; }
}
