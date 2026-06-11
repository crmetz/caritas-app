using Caritas.Models.DTOs.Perfil;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class PerfilMapper
{
    public static PerfilDto ToDto(this Perfil entity) => new()
    {
        Id = entity.Id,
        Nome = entity.Name!,
        Descricao = string.IsNullOrEmpty(entity.Descricao) ? null : entity.Descricao,
        Estatico = entity.Estatico,
    };
}
