using Caritas.Models.DTOs.LoteCesta;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces.Services;

public interface ILoteCestaService
{
    Task<LoteCestaResponseDto> RegistrarBaixaAsync(int idLote, CestaBaixaCreateDto dto);
    Task<PagedResponseDto<LoteCestaResponseDto>> GetControleAsync(
        int page, int pageSize, string? busca, OrigemCesta? origem, string? status,
        string? sortKey, string? sortDir);
    Task<List<LoteCestaSelectDto>> GetDisponiveisSelectAsync();
}
