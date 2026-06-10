using Caritas.Models.Constants;
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Paroquia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Service.Mappers;
using Caritas.Service.Session;
using Microsoft.AspNetCore.Identity;

namespace Caritas.Service.services
{
    public class ParoquiaService(
        IParoquiaRepository paroquiaRepository,
        UserManager<Usuario> userManager,
        ICurrentSession currentSession,
        IUsuarioRepository usuarioRepository)
    {
        public async Task<PagedResponseDto<ParoquiaDto>> GetPagedAsync(int page, int pageSize)
        {
            var paged = await paroquiaRepository.GetPagedWithEnderecoAsync(page, pageSize);

            return new PagedResponseDto<ParoquiaDto>
            {
                Items = paged.Items.Select(p => p.ToDto()),
                TotalCount = paged.TotalCount
            };
        }

        public async Task<List<SelectObjectDto>> GetAllSelectObject()
        {
            var paroquiaIds = await GetParoquiasFilterAsync();
            var allParoquias = await paroquiaRepository.GetAllAsync();

            var filtered = paroquiaIds == null
                ? allParoquias
                : allParoquias.Where(p => paroquiaIds.Contains(p.Id)).ToList();

            return filtered.Select(p => p.ToSelectObjectDto()).ToList();
        }

        public async Task<ParoquiaDto> GetByIdAsync(int id)
        {
            var paroquia = await paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");
            return paroquia.ToDto();
        }

        public async Task<ParoquiaDto> CreateAsync(CreateParoquiaDTO dto)
        {
            var paroquia = dto.ToEntity();
            var createdParoquia = await paroquiaRepository.AddAsync(paroquia);
            return createdParoquia.ToDto();
        }

        public async Task<ParoquiaDto> UpdateAsync(int id, UpdateParoquiaDto dto)
        {
            var paroquia = await paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            paroquia.Nome = dto.Nome;
            paroquia.Endereco.Rua = dto.Endereco.Rua;
            paroquia.Endereco.Numero = dto.Endereco.Numero;
            paroquia.Endereco.Cep = dto.Endereco.Cep;
            paroquia.Endereco.Bairro = dto.Endereco.Bairro;
            paroquia.Endereco.Cidade = dto.Endereco.Cidade;

            await paroquiaRepository.UpdateAsync(paroquia);
            return paroquia.ToDto();
        }

        public async Task DeleteAsync(long id)
        {
            throw new InvalidOperationException("Exclusão de paróquia não é permitida no momento");
        }

        private async Task<IList<int>?> GetParoquiasFilterAsync()
        {
            var usuarioId = currentSession.UsuarioId
                ?? throw new UnauthorizedAccessException("Usuário não autenticado.");

            var usuario = await userManager.FindByIdAsync(usuarioId.ToString())
                ?? throw new UnauthorizedAccessException("Usuário não encontrado.");

            if (await userManager.IsInRoleAsync(usuario, PerfisPadrao.Admin))
                return null;

            return await usuarioRepository.GetParoquiaIdsByUserIdAsync(usuarioId);
        }
    }
}
