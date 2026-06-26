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
}
