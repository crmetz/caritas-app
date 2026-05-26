using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers
{
    //substituir por AutoMapper depois
    public static class UsuarioMapper
    {
        public static UsuarioDto ToDto(this Usuario entity)
        {
            return new UsuarioDto
            {
                Id = entity.Id,
                Nome = entity.Nome,
                Sobrenome = entity.Sobrenome,
                Cpf = entity.Cpf,
                Telefone = entity.Telefone,
                DataNasc = entity.DataNasc,
                PerfilId = entity.PerfilId,
                CriadoEm = entity.CriadoEm,
                AtualizadoEm = entity.AtualizadoEm
            };
        }

        public static Usuario ToEntity(this UsuarioDto dto)
        {
            return new Usuario
            {
                Id = dto.Id,
                Nome = dto.Nome,
                Sobrenome = dto.Sobrenome,
                Cpf = dto.Cpf,
                Telefone = dto.Telefone,
                DataNasc = dto.DataNasc,
                PerfilId = dto.PerfilId,
            };
        }
    }
}
