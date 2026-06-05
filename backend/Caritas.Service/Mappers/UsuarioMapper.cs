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
                Email = entity.Email,
                Cpf = entity.Cpf,
                Telefone = entity.Telefone,
                DataNasc = entity.DataNasc,
                PerfilId = entity.PerfilId,
                CriadoEm = entity.CriadoEm,
                ParoquiasPermitidas = entity.UsuarioParoquias.Select(up => up.ParoquiaId).ToList()
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

        public static UsuarioResponseDto ToResponseDto(this Usuario entity)
        {
            return new UsuarioResponseDto
            {
                Id = entity.Id,
                Nome = entity.Nome,
                Sobrenome = entity.Sobrenome,
                Email = entity.Email,
                Telefone = entity.Telefone,
                Ativo = entity.Ativo,
                CriadoEm = entity.CriadoEm
            };
        }
    }
}
