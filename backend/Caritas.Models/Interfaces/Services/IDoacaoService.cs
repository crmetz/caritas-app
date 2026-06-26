using Caritas.Models.DTOs.Doacao;
using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.Interfaces.Services;

public interface IDoacaoService
{
    Task<DoacaoResponseDto> RegistrarAsync(DoacaoCreateDto dto);
    Task<DoacaoResponseDto> RegistrarCestasAsync(DoacaoCestaCreateDto dto);
    Task<PagedResponseDto<DoacaoListItemDto>> GetPagedAsync(int page, int pageSize);
}
