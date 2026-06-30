using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Item;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces.Services;

public interface IItemService
{
    Task<AlimentoResponseDto> CreateAlimentoAsync(AlimentoCreateDto dto);
    Task<AlimentoResponseDto> UpdateAlimentoAsync(int id, AlimentoUpdateDto dto);
    Task<RoupaResponseDto> CreateRoupaAsync(RoupaCreateDto dto);
    Task<RoupaResponseDto> UpdateRoupaAsync(int id, RoupaUpdateDto dto);
    Task DeleteAsync(int id);
    Task<List<ItemSelectDto>> GetSelectAsync(TipoItem? tipo);
    Task<PagedResponseDto<AlimentoResponseDto>> GetAlimentosAsync(
        int page, int pageSize, string? busca, string? sortKey, string? sortDir); // catálogo de gêneros
}
