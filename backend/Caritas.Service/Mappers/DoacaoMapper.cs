using Caritas.Models.DTOs.Doacao;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class DoacaoMapper
{
    public static DoacaoResponseDto ToResponseDto(this Doacao d) => new()
    { Id = d.Id, IdDoador = d.IdDoador, IdParoquia = d.IdParoquia, Tipo = d.Tipo, Observacao = d.Observacao, CriadoEm = d.CriadoEm };

    // quantidade é calculada no service (nº de linhas de item, ou nº de cestas do lote).
    public static DoacaoListItemDto ToListItemDto(this Doacao d, int quantidade) => new()
    {
        Id = d.Id, Tipo = d.Tipo, IdDoador = d.IdDoador, NomeDoador = d.Doador?.Nome,
        Quantidade = quantidade, Observacao = d.Observacao, CriadoEm = d.CriadoEm,
    };
}
