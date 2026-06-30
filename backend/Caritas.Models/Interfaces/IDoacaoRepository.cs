using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces;

public interface IDoacaoRepository : IBaseRepository<Doacao>
{
    void Add(Doacao doacao);   // sem commit (uso transacional)
    Task<PagedResponseDto<Doacao>> GetPagedAsync(
        int idParoquia, int page, int pageSize, string? busca, TipoDoacao? tipo,
        string? sortKey, string? sortDir);
}
