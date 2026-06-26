using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces.Services;

public interface IMovimentacaoService
{
    Task<MovimentacaoResponseDto> RegistrarAsync(MovimentacaoCreateDto dto);
    Task<PagedResponseDto<MovimentacaoResponseDto>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo);
    // Aplica um movimento ao saldo SEM commit nem transação própria — usado por Doacao/Montagem.
    Task AplicarMovimentoAsync(MovimentacaoEstoque movimentacao);
    // Converte o tamanho do pacote (valor + unidade) para a unidade-base do alimento. null se valor ausente.
    Task<int?> ResolverTamanhoAsync(int idItem, decimal? valor, string? unidade);
}
