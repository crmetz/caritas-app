using Caritas.Models.DTOs.Estoque;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces.Services;

public interface IEstoqueService
{
    Task<PagedResponseDto<EstoqueAlimentoResponseDto>> GetAlimentosAsync(
        int page, int pageSize, string? busca, DateOnly? validadeDe, DateOnly? validadeAte,
        string? sortKey, string? sortDir);
    Task<PagedResponseDto<EstoqueRoupaResponseDto>> GetRoupasAsync(
        int page, int pageSize, string? busca, CategoriaRoupa? categoria, CondicaoRoupa? condicao,
        string? sortKey, string? sortDir);
    Task<List<ResumoTipoAlimentoDto>> GetResumoAlimentosAsync();
    Task<EstoqueAlertasDto> GetAlimentosAlertasAsync();
}
