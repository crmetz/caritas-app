using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.FamiliaCidade;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class FamiliaCidadeMapper
{
    public static SelectObjectDto ToSelectObjectDto(this FamiliaCidade entity) => new()
    {
        Value = entity.Id,
        Label = entity.Nome,
    };

    public static FamiliaCidade ToEntity(this FamiliaCidadeCreateDto dto) => new()
    {
        Nome = dto.Nome.Trim(),
    };
}
