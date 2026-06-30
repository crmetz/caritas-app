using Caritas.Models.Constants;
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Paroquia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;
using Caritas.Service.Session;
using Microsoft.AspNetCore.Identity;
using Caritas.Service.Validators;

namespace Caritas.Service.services
{
    public class ParoquiaService(
        IParoquiaRepository paroquiaRepository,
        UserManager<Usuario> userManager,
        ICurrentSession currentSession,
        IUsuarioRepository usuarioRepository)
    {
        public async Task<PagedResponseDto<ParoquiaDto>> GetPagedAsync(ParoquiaPagedRequestDto request)
        {
            var paroquiaIds = await GetParoquiasFilterAsync();
            var paged = await paroquiaRepository.GetPagedWithEnderecoAsync(request, paroquiaIds);

            return new PagedResponseDto<ParoquiaDto>
            {
                Items = paged.Items.Select(p => p.ToDto()),
                TotalCount = paged.TotalCount
            };
        }

        public async Task<List<ParoquiaSelectObjectDto>> GetAllSelectObject()
        {
            var paroquiaIds = await GetParoquiasFilterAsync();
            var allParoquias = await paroquiaRepository.GetAllAsync();

            var filtered = paroquiaIds == null
                ? allParoquias
                : allParoquias.Where(p => paroquiaIds.Contains(p.Id)).ToList();

            return filtered
                .OrderByDescending(p => p.Raiz)
                .ThenBy(p => p.Nome)
                .Select(p => p.ToSelectObjectDto())
                .ToList();
        }

        public async Task<ParoquiaDto> GetByIdAsync(int id)
        {
            var paroquia = await paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            var paroquiasEditor = await GetParoquiasFilterAsync();

            if (paroquiasEditor is not null && !paroquiasEditor.Contains(id))
                throw new UnauthorizedAccessException("Você não tem permissão para visualizar esta paróquia.");

            return paroquia.ToDto();
        }
        public async Task<ParoquiaDto> CreateAsync(CreateParoquiaDTO dto)
        {
            if (dto.Endereco is not null && !string.IsNullOrWhiteSpace(dto.Endereco.Cep) && !CepValidator.Validate(dto.Endereco.Cep))
                throw new InvalidOperationException("Cep Inválido");

            var paroquia = dto.ToEntity();
            var createdParoquia = await paroquiaRepository.AddAsync(paroquia);
            return createdParoquia.ToDto();
        }

        public async Task<ParoquiaDto> UpdateAsync(int id, UpdateParoquiaDto dto)
        {
            var paroquia = await paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            var paroquiasEditor = await GetParoquiasFilterAsync();

            if (paroquiasEditor is not null && !paroquiasEditor.Contains(id))
                throw new UnauthorizedAccessException("Você não tem permissão para editar esta paróquia.");

            if (dto.Endereco is not null && !string.IsNullOrWhiteSpace(dto.Endereco.Cep) && !CepValidator.Validate(dto.Endereco.Cep))
                throw new InvalidOperationException("Cep Inválido");

            if (paroquia.Raiz)
                throw new InvalidOperationException("A diocese não pode ser editada.");

            paroquia.Nome = dto.Nome;
            paroquia.Endereco.Rua = dto.Endereco.Rua;
            paroquia.Endereco.Numero = dto.Endereco.Numero;
            paroquia.Endereco.Cep = dto.Endereco.Cep;
            paroquia.Endereco.Bairro = dto.Endereco.Bairro;
            paroquia.Endereco.Cidade = dto.Endereco.Cidade;

            await paroquiaRepository.UpdateAsync(paroquia);
            return paroquia.ToDto();
        }

        public async Task DeleteAsync(int id)
        {
            var paroquia = await paroquiaRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Paróquia com id {id} não encontrada.");

            if (paroquia.Raiz)
                throw new ArgumentException("A diocese não pode ser inativada.");

            if (currentSession.ParoquiaAtualId == id)
                throw new InvalidOperationException("Não é possível inativar a paróquia que está selecionada no momento.");

            var usuarios = await usuarioRepository.GetByParoquiaAsync(id);
            if (usuarios.Count > 0)
                throw new InvalidOperationException("Não é possível inativar uma paróquia com usuários ativos vinculados.");

            paroquia.Ativa = false;
            await paroquiaRepository.UpdateAsync(paroquia);
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
