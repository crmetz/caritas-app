using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IConfiguracaoCestaRepository : IBaseRepository<ConfiguracaoCesta>
{
    Task<ConfiguracaoCesta?> GetByIdWithItensAsync(int id);
    Task<PagedResponseDto<ConfiguracaoCesta>> GetPagedWithItensAsync(int idParoquia, int page, int pageSize);
    Task SaveAsync();
}
