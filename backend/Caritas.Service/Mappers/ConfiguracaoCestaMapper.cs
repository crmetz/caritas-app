using Caritas.Models.DTOs.ConfiguracaoCesta;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class ConfiguracaoCestaMapper
{
    public static ConfiguracaoCestaResponseDto ToResponseDto(this ConfiguracaoCesta c) => new()
    {
        Id = c.Id,
        Nome = c.Nome,
        Itens = c.Itens.Select(i => new ItemConfiguracaoCestaResponseDto
        {
            IdAlimento = i.IdAlimento,
            NomeAlimento = i.Alimento.Descricao,
            Tamanho = i.Tamanho,
            TamanhoFormatado = MedidaHelper.Formatar(i.Tamanho, i.Alimento.FormaMedida),
            QuantidadePacotes = i.QuantidadePacotes,
        }).ToList(),
    };
}
