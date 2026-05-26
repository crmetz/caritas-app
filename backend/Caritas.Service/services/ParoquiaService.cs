using Caritas.Models.DTOs.Endereço;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Paroquia;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Service.Mappers;

namespace Caritas.Service.services
{
    public class ParoquiaService
    {
        private readonly IParoquiaRepository _paroquiaRepository;
        public ParoquiaService(IParoquiaRepository paroquiaRepository)
        {
            _paroquiaRepository = paroquiaRepository;
        }

        public async Task<PagedResponseDto<ParoquiaDto>> GetPagedAsync(int page, int pageSize)
        {
            var paged = await _paroquiaRepository.GetPagedWithEnderecoAsync(page, pageSize);

            return new PagedResponseDto<ParoquiaDto>
            {
                Items = paged.Items.Select(p => p.ToDto()),
                TotalCount = paged.TotalCount
            };
        }

        public async Task<ParoquiaDto> GetByIdAsync(int id)
        {
            var paroquia = await _paroquiaRepository.GetByIdAsync(id);

            if(paroquia == null) throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");
            return paroquia.ToDto();
        }

        public async Task<ParoquiaDto> CreateAsync(CreateParoquiaDTO dto)
        {
            var paroquia = dto.ToEntity();

            var createdParoquia = await _paroquiaRepository.AddAsync(paroquia);
            return createdParoquia.ToDto();
        }
        public async Task<ParoquiaDto> UpdateAsync(int id, UpdateParoquiaDto dto)
        {
            var paroquia = await _paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            paroquia.Nome = dto.Nome;

            paroquia.Endereco.Rua = dto.Endereco.Rua;
            paroquia.Endereco.Numero = dto.Endereco.Numero;
            paroquia.Endereco.Cep = dto.Endereco.Cep;
            paroquia.Endereco.Bairro = dto.Endereco.Bairro;
            paroquia.Endereco.Cidade = dto.Endereco.Cidade;

            await _paroquiaRepository.UpdateAsync(paroquia);
            return paroquia.ToDto();
        }

        public async Task DeleteAsync(long id)
        {
            throw new InvalidOperationException("Exclusão de paróquia não é permitida no momento");
            //não podemos simplesmente excluir a paróquia devido a todos os registros que estarão vinculados a ela, além 
            //de usuários. o certo é a gente fazer a operação de inativação, mas podemos deixar para depois

            //var paroquia = await _paroquiaRepository.GetByIdAsync(id)
            //    ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            //await _paroquiaRepository.DeleteAsync(paroquia);
        }
    }
}
