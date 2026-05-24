using Caritas.Models.DTOs.Paroquia;
using Caritas.Models.Entities;
using Caritas.Repository.Repositories;

namespace Caritas.Service.services
{
    public class ParoquiaService
    {
        private readonly ParoquiaRepository _paroquiaRepository;
        public ParoquiaService(ParoquiaRepository paroquiaRepository)
        {
            _paroquiaRepository = paroquiaRepository;
        }

        public async Task<Paroquia> GetByIdAsync(long id)
        {
            return await _paroquiaRepository.GetByIdAsync(id);
        }

        public async Task<Paroquia> CreateAsync(ParoquiaCreateDTO dto)
        {
            var paroquia = new Paroquia
            {
                Nome = dto.Nome,
                Endereco = new Endereco
                {
                    Rua = dto.Endereco.Rua,
                    Numero = dto.Endereco.Numero,
                    Cep = dto.Endereco.Cep,
                    Bairro = dto.Endereco.Bairro,
                    Cidade = dto.Endereco.Cidade,
                }
            };

            return await _paroquiaRepository.AddAsync(paroquia);
        }
        public async Task<Paroquia> UpdateAsync(long id, ParoquiaUpdateDTO dto)
        {
            var paroquia = await _paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            paroquia.Nome = dto.Nome;

            paroquia.Endereco.Rua = dto.Endereco.Rua;
            paroquia.Endereco.Numero = dto.Endereco.Numero;
            paroquia.Endereco.Cep = dto.Endereco.Cep;
            paroquia.Endereco.Bairro = dto.Endereco.Bairro;
            paroquia.Endereco.Cidade = dto.Endereco.Cidade;

            paroquia.UsuarioParoquias = new List<UsuarioParoquia>(dto.UsuarioParoquias);

            return await _paroquiaRepository.UpdateAsync(paroquia);
        }

        public async Task DeleteAsync(long id)
        {
            var paroquia = await _paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            await _paroquiaRepository.DeleteAsync(paroquia);
        }
    }
}
