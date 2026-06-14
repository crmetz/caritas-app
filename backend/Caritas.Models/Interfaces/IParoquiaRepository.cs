using Caritas.Models.Entities;
using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.Interfaces
{
    public interface IParoquiaRepository : IBaseRepository<Paroquia>
    {
        Task<PagedResponseDto<Paroquia>> GetPagedWithEnderecoAsync(int page, int pageSize, IList<int> paroquiaIds);
    }
}
