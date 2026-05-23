using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IBaseRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);
    Task<PagedResponseDto<T>> GetPagedAsync(int page, int pageSize);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
}
