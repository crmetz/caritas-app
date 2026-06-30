using Caritas.Models.DTOs.Doador;
using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.Interfaces.Services;

public interface IDoadorService
{
    Task<PagedResponseDto<DoadorResponseDto>> GetPagedAsync(int page, int pageSize);
    Task<DoadorResponseDto> GetByIdAsync(int id);
    Task<DoadorResponseDto> CreateAsync(DoadorCreateDto dto);
    Task<DoadorResponseDto> UpdateAsync(int id, DoadorUpdateDto dto);
    Task DeleteAsync(int id);
}
