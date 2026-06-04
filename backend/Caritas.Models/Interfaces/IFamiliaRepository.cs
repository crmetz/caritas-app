using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IFamiliaRepository : IBaseRepository<Familia>
{
    Task<Familia?> GetWithMembrosAsync(int id);
    Task<PagedResponseDto<Familia>> GetPagedByParoquiaAsync(int page, int pageSize, int? paroquiaId);
}
