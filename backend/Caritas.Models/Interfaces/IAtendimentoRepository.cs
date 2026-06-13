using Caritas.Models.DTOs.Atendimento;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IAtendimentoRepository : IBaseRepository<Atendimento>
{
    Task<Atendimento?> GetByIdWithRelacionamentosAsync(int id);
    Task<PagedResponseDto<Atendimento>> GetPagedAsync(int page, int pageSize, AtendimentoFilterDto filter);
    Task<List<Atendimento>> GetByFamiliaOrderedAsync(int familiaId);
    Task<List<Atendimento>> GetByParoquiaOrderedAsync(int paroquiaId);
}
