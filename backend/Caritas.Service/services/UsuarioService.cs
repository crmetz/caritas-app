using Caritas.Models.Constants;
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Service.Mappers;
using Caritas.Service.Session;
using Microsoft.AspNetCore.Identity;

namespace Caritas.Service.Services;

public class UsuariosService(
    IUsuarioRepository usuarioRepository,
    UserManager<Usuario> userManager,
    ICurrentSession currentSession)
{
    public async Task<PagedResponseDto<UsuarioResponseDto>> GetPagedAsync(UsuarioPagedRequestDto request)
    {
        var paroquiaIds = await GetParoquiasFilterAsync();
        var paged = await usuarioRepository.GetPagedAsync(request, paroquiaIds);

        return new PagedResponseDto<UsuarioResponseDto>
        {
            Items = paged.Items.Select(p => p.ToResponseDto()),
            TotalCount = paged.TotalCount
        };
    }

    public async Task<List<SelectObjectDto>> GetSelectByParoquiaAsync(int paroquiaId)
    {
        var usuarios = await usuarioRepository.GetByParoquiaAsync(paroquiaId);
        return usuarios
            .Select(u => new SelectObjectDto
            {
                Value = u.Id,
                Label = $"{u.Nome} {u.Sobrenome}".Trim(),
            })
            .ToList();
    }

    public async Task<UsuarioDto> GetByIdAsync(int id)
    {
        var usuario = await usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");
        return usuario.ToDto();
    }

    public async Task<UsuarioDto> UpdateAsync(int id, UpdateUsuarioDto dto)
    {
        var usuario = await usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Nome = dto.Nome ?? usuario.Nome;
        usuario.Sobrenome = dto.Sobrenome ?? usuario.Sobrenome;
        usuario.Telefone = dto.Telefone ?? usuario.Telefone;
        usuario.DataNasc = dto.DataNasc ?? usuario.DataNasc;
        usuario.Cpf = dto.Cpf ?? usuario.Cpf;

        var paroquiasToRemove = usuario.UsuarioParoquias
            .Where(up => !dto.ParoquiasPermitidas.Contains(up.ParoquiaId))
            .ToList();

        foreach (var up in paroquiasToRemove)
            usuario.UsuarioParoquias.Remove(up);

        foreach (var paroquiaId in dto.ParoquiasPermitidas)
            if (!usuario.UsuarioParoquias.Any(up => up.ParoquiaId == paroquiaId))
                usuario.UsuarioParoquias.Add(new UsuarioParoquia { ParoquiaId = paroquiaId });

        await usuarioRepository.UpdateAsync(usuario);
        return usuario.ToDto();
    }

    public async Task DeactivateAsync(int id)
    {
        if (currentSession.UsuarioId == id)
            throw new InvalidOperationException("Não é possível inativar o próprio usuário.");

        var usuario = await usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Ativo = false;
        usuario.DataInativacao = DateTime.UtcNow;

        await usuarioRepository.UpdateAsync(usuario);
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
