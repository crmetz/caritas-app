using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Item;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class ItemMapper
{
    public static Alimento ToEntity(this AlimentoCreateDto dto) => new()
    {
        Descricao = dto.Descricao, FormaMedida = dto.FormaMedida,
    };

    public static Roupa ToEntity(this RoupaCreateDto dto) => new()
    {
        Descricao = dto.Descricao, Categoria = dto.Categoria, FaixaEtaria = dto.FaixaEtaria,
        Genero = dto.Genero, Tamanho = dto.Tamanho, Estacao = dto.Estacao,
        Condicao = dto.Condicao, Codigo = dto.Codigo,
    };

    public static AlimentoResponseDto ToResponseDto(this Alimento a) => new()
    {
        Id = a.Id, Descricao = a.Descricao, FormaMedida = a.FormaMedida,
        CriadoEm = a.CriadoEm, AtualizadoEm = a.AtualizadoEm,
    };

    public static RoupaResponseDto ToResponseDto(this Roupa r) => new()
    {
        Id = r.Id, Descricao = r.Descricao, Categoria = r.Categoria, FaixaEtaria = r.FaixaEtaria,
        Genero = r.Genero, Tamanho = r.Tamanho, Estacao = r.Estacao, Condicao = r.Condicao,
        Codigo = r.Codigo, CriadoEm = r.CriadoEm, AtualizadoEm = r.AtualizadoEm,
    };

    public static SelectObjectDto ToSelectObjectDto(this Item i) => new() { Value = i.Id, Label = i.Descricao };

    public static ItemSelectDto ToItemSelectDto(this Item i) => new()
    {
        Value = i.Id,
        Label = i.Descricao,
        Tipo = i.Tipo,
        FormaMedida = i is Alimento a ? a.FormaMedida : null,
    };
}
