using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Item;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class ItemService(IItemRepository itemRepository) : IItemService
{
    public async Task<AlimentoResponseDto> CreateAlimentoAsync(AlimentoCreateDto dto)
    {
        if (await itemRepository.AlimentoNomeExisteAsync(dto.Descricao))
            throw new InvalidOperationException($"Já existe um alimento '{dto.Descricao}'.");
        return (await itemRepository.AddAlimentoAsync(dto.ToEntity())).ToResponseDto();
    }

    public async Task<AlimentoResponseDto> UpdateAlimentoAsync(int id, AlimentoUpdateDto dto)
    {
        var alimento = await itemRepository.GetAlimentoByIdAsync(id)
            ?? throw new KeyNotFoundException($"Alimento com id {id} não encontrado.");
        if (await itemRepository.AlimentoNomeExisteAsync(dto.Descricao, id))
            throw new InvalidOperationException($"Já existe um alimento '{dto.Descricao}'.");
        alimento.Descricao = dto.Descricao;
        alimento.FormaMedida = dto.FormaMedida;
        await itemRepository.UpdateAsync(alimento);
        return alimento.ToResponseDto();
    }

    public async Task<RoupaResponseDto> CreateRoupaAsync(RoupaCreateDto dto)
    {
        dto.Tamanho = NormalizarTamanho(dto.Tamanho);
        return (await itemRepository.AddRoupaAsync(dto.ToEntity())).ToResponseDto();
    }

    public async Task<RoupaResponseDto> UpdateRoupaAsync(int id, RoupaUpdateDto dto)
    {
        var roupa = await itemRepository.GetRoupaByIdAsync(id)
            ?? throw new KeyNotFoundException($"Roupa com id {id} não encontrada.");
        roupa.Descricao = dto.Descricao; roupa.Categoria = dto.Categoria; roupa.FaixaEtaria = dto.FaixaEtaria;
        roupa.Genero = dto.Genero; roupa.Tamanho = NormalizarTamanho(dto.Tamanho); roupa.Estacao = dto.Estacao;
        roupa.Condicao = dto.Condicao; roupa.Codigo = dto.Codigo;
        await itemRepository.UpdateAsync(roupa);
        return roupa.ToResponseDto();
    }

    // Tamanho de roupa é texto livre, sempre persistido em maiúsculo ("gg" → "GG").
    private static string? NormalizarTamanho(string? tamanho)
    {
        var t = tamanho?.Trim();
        return string.IsNullOrEmpty(t) ? null : t.ToUpperInvariant();
    }

    public async Task DeleteAsync(int id)
    {
        if (await itemRepository.ItemEmUsoAsync(id))
            throw new InvalidOperationException(
                "Este alimento não pode ser excluído porque está sendo utilizado em outros registros.");
        await itemRepository.DeleteAsync(id);
    }

    public async Task<List<ItemSelectDto>> GetSelectAsync(TipoItem? tipo)
        => (await itemRepository.GetSelectAsync(tipo)).Select(i => i.ToItemSelectDto()).ToList();

    public async Task<List<AlimentoResponseDto>> GetAlimentosAsync()
    {
        var emUso = await itemRepository.GetItensEmUsoAsync();
        return (await itemRepository.GetAlimentosAsync())
            .Select(a =>
            {
                var dto = a.ToResponseDto();
                dto.EmUso = emUso.Contains(a.Id);
                return dto;
            })
            .ToList();
    }
}
