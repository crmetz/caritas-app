using Caritas.Models.DTOs.LoteCesta;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class LoteCestaMapper
{
    public static LoteCestaResponseDto ToResponseDto(this LoteCesta l) => new()
    {
        Id = l.Id,
        Origem = l.Origem,
        IdConfiguracaoCesta = l.IdConfiguracaoCesta,
        NomeConfiguracao = l.ConfiguracaoCesta?.Nome,
        IdDoador = l.Doacao?.IdDoador,
        NomeDoador = l.Doacao?.Doador?.Nome,
        Quantidade = l.Quantidade,
        QuantidadeDisponivel = l.QuantidadeDisponivel,
        Observacao = l.Observacao,
        CriadoEm = l.CriadoEm,
    };
}
