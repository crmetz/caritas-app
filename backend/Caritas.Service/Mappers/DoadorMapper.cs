using Caritas.Models.DTOs.Doador;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class DoadorMapper
{
    public static Doador ToEntity(this DoadorCreateDto d) => new() { Nome = d.Nome, Documento = d.Documento, Telefone = d.Telefone };
    public static DoadorResponseDto ToResponseDto(this Doador d) => new() { Id = d.Id, Nome = d.Nome, Documento = d.Documento, Telefone = d.Telefone };
}
