using Caritas.Models.DTOs.Entrega;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class EntregaMapper
{
    public static EntregaResponseDto ToResponseDto(this Entrega e) => new()
    { Id = e.Id, IdFamilia = e.IdFamilia, IdParoquia = e.IdParoquia, Observacao = e.Observacao, CriadoEm = e.CriadoEm };

    // qtdCestas/qtdItens são calculadas no service (Σ cestas; nº de linhas de item).
    public static EntregaListItemDto ToListItemDto(this Entrega e, int qtdCestas, int qtdItens) => new()
    {
        Id = e.Id, IdFamilia = e.IdFamilia, NomeFamilia = e.Familia?.Responsavel?.Nome,
        QtdCestas = qtdCestas, QtdItens = qtdItens, Observacao = e.Observacao, CriadoEm = e.CriadoEm,
    };
}
