using Caritas.Models.Constants;
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;
using Caritas.Service.Services.Email.Templates;
using Caritas.Service.Session;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Caritas.Service.Validators;

namespace Caritas.Service.Services;

public class UsuariosService(
    IUsuarioRepository usuarioRepository,
    UserManager<Usuario> userManager,
    RoleManager<Perfil> roleManager,
    ICurrentSession currentSession,
    IConfiguration configuration,
    IEmailService emailService)
{
    private readonly PerfilService _perfilService = new(roleManager, userManager);

    public async Task<UsuarioDto> CreateAsync(CreateUsuarioDto dto)
    {
        var currentUserId = currentSession.UsuarioId
            ?? throw new UnauthorizedAccessException("Usuário não autenticado.");

        var existente = await userManager.FindByEmailAsync(dto.Email);
        if (existente is not null)
            throw new ArgumentException($"Já existe um usuário cadastrado com o e-mail '{dto.Email}'.");

        if (!string.IsNullOrWhiteSpace(dto.Telefone) && !PhoneValidator.Validate(dto.Telefone))
            throw new InvalidOperationException("Telefone inválido.");

        if (!string.IsNullOrWhiteSpace(dto.Cpf) && !CpfValidator.Validate(dto.Cpf))
            throw new InvalidOperationException("Cpf Inválido");

        if (dto.PerfilId is not null)
            await _perfilService.EnsureCanAssignAsync(currentUserId, dto.PerfilId.Value);

        // Escopo de paróquias do editor — null significa admin (sem restrição)
        var paroquiasEditor = await GetParoquiasFilterAsync();

        if (paroquiasEditor is not null)
        {
            var paroquiasForaDoEscopo = dto.ParoquiasPermitidas
                .Where(id => !paroquiasEditor.Contains(id))
                .ToList();

            if (paroquiasForaDoEscopo.Count > 0)
                throw new UnauthorizedAccessException(
                    $"Você não tem permissão para atribuir as paróquias: {string.Join(", ", paroquiasForaDoEscopo)}.");
        }

        var paroquiasPermitidas = paroquiasEditor is null
            ? dto.ParoquiasPermitidas
            : dto.ParoquiasPermitidas.Where(paroquiasEditor.Contains).ToList();

        var usuario = new Usuario
        {
            UserName = dto.Email,
            Email = dto.Email,
            Nome = dto.Nome,
            Sobrenome = dto.Sobrenome,
            Cpf = dto.Cpf,
            Telefone = dto.Telefone,
            DataNasc = dto.DataNasc,
            Ativo = true,
            UsuarioAdmin = false,
            UsuarioCriadorId = currentUserId,
            CriadoEm = DateTime.UtcNow,
            UsuarioParoquias = paroquiasPermitidas
                .Select(paroquiaId => new UsuarioParoquia { ParoquiaId = paroquiaId })
                .ToList()
        };

        var tempPassword = "SenhaTemp@123";
        var resultado = await userManager.CreateAsync(usuario, tempPassword);
        if (!resultado.Succeeded)
            throw new Exception("Erro ao criar usuário: " + string.Join(", ", resultado.Errors.Select(e => e.Description)));

        await _perfilService.AssignRoleAsync(usuario, dto.PerfilId, currentUserId);

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(usuario);
        var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
        var link = $"{frontendUrl}/redefinir-senha?email={Uri.EscapeDataString(usuario.Email!)}&token={Uri.EscapeDataString(resetToken)}";

        try
        {
            await emailService.SendAsync(usuario.Email!, FirstAccessEmail.Subject, FirstAccessEmail.Build(usuario.Nome!, link));
        }
        catch
        {
            throw new Exception("Usuário criado, mas falha ao enviar e-mail de boas-vindas");
        }

        return usuario.ToDto();
    }

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

        var dto = usuario.ToDto();

        var paroquiasEditor = await GetParoquiasFilterAsync();

        // Editor não-admin só pode editar usuários que compartilham ao menos
        // uma paróquia dentro do seu escopo
        if (paroquiasEditor is not null &&
            !usuario.UsuarioParoquias.Any(up => paroquiasEditor.Contains(up.ParoquiaId)))
        {
            throw new UnauthorizedAccessException("Você não tem permissão para visualizar este usuário.");
        }

        var roleName = (await userManager.GetRolesAsync(usuario)).FirstOrDefault();
        if (roleName != null)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                dto.PerfilId = role.Id;
                dto.Perfil = new SelectObjectDto { Value = role.Id, Label = role.Name };
            }
        }

        return dto;
    }

    public async Task<UsuarioDto> UpdateAsync(int id, UpdateUsuarioDto dto)
    {
        var usuario = await usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        // Escopo de paróquias do editor — null significa admin (sem restrição)
        var paroquiasEditor = await GetParoquiasFilterAsync();

        // Editor não-admin só pode editar usuários que compartilham ao menos
        // uma paróquia dentro do seu escopo
        if (paroquiasEditor is not null &&
            !usuario.UsuarioParoquias.Any(up => paroquiasEditor.Contains(up.ParoquiaId)))
        {
            throw new UnauthorizedAccessException("Você não tem permissão para editar este usuário.");
        }

        usuario.Nome = dto.Nome ?? usuario.Nome;
        usuario.Sobrenome = dto.Sobrenome ?? usuario.Sobrenome;
        usuario.Telefone = dto.Telefone ?? usuario.Telefone;
        usuario.DataNasc = dto.DataNasc ?? usuario.DataNasc;
        usuario.Cpf = dto.Cpf ?? usuario.Cpf;

        if (!string.IsNullOrWhiteSpace(dto.Telefone) && !PhoneValidator.Validate(dto.Telefone))
            throw new InvalidOperationException("Telefone inválido.");

        if (!string.IsNullOrWhiteSpace(dto.Cpf) && !CpfValidator.Validate(dto.Cpf))
            throw new InvalidOperationException("Cpf Inválido");

        if (paroquiasEditor is not null)
        {
            var paroquiasForaDoEscopo = dto.ParoquiasPermitidas
                .Where(pid => !paroquiasEditor.Contains(pid))
                .Where(pid => !usuario.UsuarioParoquias.Any(up => up.ParoquiaId == pid))
                .ToList();

            if (paroquiasForaDoEscopo.Count > 0)
                throw new UnauthorizedAccessException(
                    $"Você não tem permissão para atribuir as paróquias: {string.Join(", ", paroquiasForaDoEscopo)}.");
        }

        var paroquiasToRemove = usuario.UsuarioParoquias
            .Where(up => !dto.ParoquiasPermitidas.Contains(up.ParoquiaId))
            .Where(up => paroquiasEditor is null || paroquiasEditor.Contains(up.ParoquiaId))
            .ToList();

        foreach (var up in paroquiasToRemove)
            usuario.UsuarioParoquias.Remove(up);

        foreach (var paroquiaId in dto.ParoquiasPermitidas)
        {
            if (usuario.UsuarioParoquias.Any(up => up.ParoquiaId == paroquiaId))
                continue;

            if (paroquiasEditor is not null && !paroquiasEditor.Contains(paroquiaId))
                continue;

            usuario.UsuarioParoquias.Add(new UsuarioParoquia { ParoquiaId = paroquiaId });
        }

        var currentUserId = currentSession.UsuarioId;
        await _perfilService.AssignRoleAsync(usuario, dto.PerfilId, (int)currentUserId!);

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
