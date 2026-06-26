using Caritas.Models.DTOs.ConfiguracaoCesta;
using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.Interfaces.Services;

public interface IConfiguracaoCestaService
{
    Task<ConfiguracaoCestaResponseDto> CreateAsync(ConfiguracaoCestaCreateDto dto);
    Task<ConfiguracaoCestaResponseDto> UpdateAsync(int id, ConfiguracaoCestaUpdateDto dto);
    Task<ConfiguracaoCestaResponseDto> GetByIdAsync(int id);
    Task<PagedResponseDto<ConfiguracaoCestaResponseDto>> GetPagedAsync(int page, int pageSize);
    Task DeleteAsync(int id);
}
