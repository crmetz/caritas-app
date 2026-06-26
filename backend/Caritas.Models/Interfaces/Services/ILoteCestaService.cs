using Caritas.Models.DTOs.LoteCesta;
using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.Interfaces.Services;

public interface ILoteCestaService
{
    Task<LoteCestaResponseDto> RegistrarBaixaAsync(int idLote, CestaBaixaCreateDto dto);
    Task<PagedResponseDto<LoteCestaResponseDto>> GetControleAsync(int page, int pageSize);
    Task<List<LoteCestaSelectDto>> GetDisponiveisSelectAsync();
}
