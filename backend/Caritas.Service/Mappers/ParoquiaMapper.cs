using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Endereço;
using Caritas.Models.DTOs.Paroquia;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers
{
    //substituir por AutoMapper depois
    public static class ParoquiaMapper
    {
        public static ParoquiaDto ToDto(this Paroquia entity)
        {
            return new ParoquiaDto
            {
                Id = entity.Id,
                Nome = entity.Nome,

                Endereco = entity.Endereco == null
                    ? null
                    : new EnderecoDto
                    {
                        Rua = entity.Endereco.Rua,
                        Numero = entity.Endereco.Numero,
                        Cep = entity.Endereco.Cep,
                        Bairro = entity.Endereco.Bairro,
                        Cidade = entity.Endereco.Cidade
                    },

                CriadoEm = entity.CriadoEm,
                AtualizadoEm = entity.AtualizadoEm
            };
        }

        public static Paroquia ToEntity(this CreateParoquiaDTO dto)
        {
            return new Paroquia
            {
                Nome = dto.Nome,
                Endereco = dto.Endereco == null
                    ? null
                    : new Endereco
                    {
                        Rua = dto.Endereco.Rua,
                        Numero = dto.Endereco.Numero,
                        Cep = dto.Endereco.Cep,
                        Bairro = dto.Endereco.Bairro,
                        Cidade = dto.Endereco.Cidade
                    }
            };
        }

        public static SelectObjectDto ToSelectObjectDto(this Paroquia entity)
        {
            return new SelectObjectDto
            {
                Value = entity.Id,
                Label = entity.Nome
            };
        }
    }
}
