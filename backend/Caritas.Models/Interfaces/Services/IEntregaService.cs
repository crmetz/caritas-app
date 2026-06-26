using Caritas.Models.DTOs.Entrega;
using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.Interfaces.Services;

public interface IEntregaService
{
    Task<EntregaResponseDto> RegistrarAsync(EntregaCreateDto dto);
    Task<PagedResponseDto<EntregaListItemDto>> GetPagedAsync(int page, int pageSize);
}
