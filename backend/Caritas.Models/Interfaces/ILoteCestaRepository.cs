using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface ILoteCestaRepository : IBaseRepository<LoteCesta>
{
    void Add(LoteCesta lote);                     // sem commit (uso transacional)
    Task<PagedResponseDto<LoteCesta>> GetControlePagedAsync(int idParoquia, int page, int pageSize);
    Task<List<LoteCesta>> GetDisponiveisAsync(int idParoquia);
}
