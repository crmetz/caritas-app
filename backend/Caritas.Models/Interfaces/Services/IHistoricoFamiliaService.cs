using Caritas.Models.DTOs.Familia;
using Caritas.Models.DTOs.Pagination;

namespace Caritas.Models.Interfaces.Services;

public interface IHistoricoFamiliaService
{
    /// <summary>
    /// Linha do tempo da família: atendimentos, entregas e saídas de caixa em ordem cronológica.
    /// As flags refletem as permissões do usuário e são resolvidas no controller.
    /// </summary>
    Task<PagedResponseDto<EventoHistoricoDto>> GetAsync(
        int familiaId, int page, int pageSize, bool incluirEntregas, bool incluirCaixa);
}
