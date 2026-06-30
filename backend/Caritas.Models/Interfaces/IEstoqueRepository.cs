using Caritas.Models.DTOs.Estoque;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces;

public interface IEstoqueRepository : IBaseRepository<Estoque>
{
    // Estoque de alimentos com busca/filtro de validade/ordenação/paginação server-side.
    Task<PagedResponseDto<Estoque>> GetAlimentosPagedAsync(
        int page, int pageSize, string? busca, DateOnly? validadeDe, DateOnly? validadeAte,
        string? sortKey, string? sortDir);
    // Contagens de vencidos / a vencer em até 30 dias (independem da paginação).
    Task<EstoqueAlertasDto> GetAlimentosAlertasAsync(DateOnly hoje);
    Task<PagedResponseDto<Estoque>> GetRoupasPagedAsync(
        int page, int pageSize, string? busca, CategoriaRoupa? categoria, CondicaoRoupa? condicao,
        string? sortKey, string? sortDir);
    Task<Estoque?> GetByCoordsForUpdateAsync(int idItem, int idParoquia, int? tamanho, DateOnly? validade, string? lote);
    // Resumo por gênero (TotalBase preenchido; TextoFormatado fica a cargo do service).
    Task<List<ResumoTipoAlimentoDto>> GetResumoAlimentosAsync(int idParoquia);
    // Lotes com saldo de um (alimento, tamanho) na paróquia, ordenados por validade mais próxima (nulls por último).
    Task<List<Estoque>> GetLotesDisponiveisAsync(int idItem, int tamanho, int idParoquia);
    void Add(Estoque estoque);                   // sem commit (uso transacional)
}
