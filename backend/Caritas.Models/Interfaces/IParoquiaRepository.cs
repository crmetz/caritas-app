using Caritas.Models.DTOs.Paroquia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces
{
    public interface IParoquiaRepository : IBaseRepository<Paroquia>
    {
        Task<PagedResponseDto<Paroquia>> GetPagedWithEnderecoAsync(ParoquiaPagedRequestDto request, IList<int>? paroquiaIds);
    }
}
