using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IEntregaRepository : IBaseRepository<Entrega>
{
    void Add(Entrega entrega);   // sem commit (uso transacional)
    Task<PagedResponseDto<Entrega>> GetPagedAsync(int idParoquia, int page, int pageSize);
}
