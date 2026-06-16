using Caritas.Models.DTOs.Familia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IFamiliaRepository : IBaseRepository<Familia>
{
    Task<Familia?> GetWithMembrosAsync(int id);
    Task<PagedResponseDto<Familia>> GetPagedAsync(int page, int pageSize, FamiliaFilterDto filter);
    Task<List<Familia>> GetSelectAsync(int? paroquiaId);
}
