using Caritas.Models.DTOs.Estoque;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class EstoqueMapper
{
    public static EstoqueAlimentoResponseDto ToAlimentoDto(this Estoque e)
    {
        var alimento = (Alimento)e.Item;
        return new()
        {
            Id = e.Id, IdItem = e.IdItem, Descricao = alimento.Descricao, FormaMedida = alimento.FormaMedida,
            Tamanho = e.Tamanho,
            TamanhoFormatado = e.Tamanho.HasValue ? MedidaHelper.Formatar(e.Tamanho.Value, alimento.FormaMedida) : null,
            Validade = e.Validade, Lote = e.Lote, Quantidade = e.Quantidade, AtualizadoEm = e.AtualizadoEm,
        };
    }

    public static EstoqueRoupaResponseDto ToRoupaDto(this Estoque e)
    {
        var roupa = (Roupa)e.Item;
        return new()
        {
            Id = e.Id, IdItem = e.IdItem, Descricao = roupa.Descricao, Categoria = roupa.Categoria,
            Tamanho = roupa.Tamanho, Condicao = roupa.Condicao, Lote = e.Lote, Quantidade = e.Quantidade,
            AtualizadoEm = e.AtualizadoEm,
        };
    }
}
