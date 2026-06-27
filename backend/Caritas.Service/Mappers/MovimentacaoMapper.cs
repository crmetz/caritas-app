using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class MovimentacaoMapper
{
    public static MovimentacaoResponseDto ToResponseDto(this MovimentacaoEstoque m) => new()
    {
        Id = m.Id, IdItem = m.IdItem, IdParoquia = m.IdParoquia, Tamanho = m.Tamanho, Validade = m.Validade, Lote = m.Lote,
        TipoOperacao = m.TipoOperacao, Quantidade = m.Quantidade, OrigemTipo = m.OrigemTipo,
        OrigemId = m.OrigemId, Observacao = m.Observacao, CriadoEm = m.CriadoEm, CriadoPor = m.CriadoPor,
    };

    public static MovimentacaoHistoricoDto ToHistoricoDto(this MovimentacaoEstoque m, Item? item) => new()
    {
        Id = m.Id, IdItem = m.IdItem, Descricao = item?.Descricao, TipoItem = item?.Tipo,
        Tamanho = m.Tamanho, Validade = m.Validade, Lote = m.Lote,
        TipoOperacao = m.TipoOperacao, Quantidade = m.Quantidade, OrigemTipo = m.OrigemTipo,
        OrigemId = m.OrigemId, Observacao = m.Observacao, CriadoEm = m.CriadoEm,
    };
}
