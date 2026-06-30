using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces;

public interface ILoteCestaRepository : IBaseRepository<LoteCesta>
{
    void Add(LoteCesta lote);                     // sem commit (uso transacional)
    Task<PagedResponseDto<LoteCesta>> GetControlePagedAsync(
        int idParoquia, int page, int pageSize, string? busca, OrigemCesta? origem, string? status,
        string? sortKey, string? sortDir);
    Task<List<LoteCesta>> GetDisponiveisAsync(int idParoquia);
}
