using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces;

public interface IMovimentacaoRepository : IBaseRepository<MovimentacaoEstoque>
{
    Task<PagedResponseDto<MovimentacaoEstoque>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo,
        TipoItem? tipoItem, TipoOperacao? tipoOperacao, string? sortDir);
    void Add(MovimentacaoEstoque movimentacao);  // sem commit (uso transacional)
}
