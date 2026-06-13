using System.Security.Claims;
using Caritas.Models.Constants;
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Perfil;
using Caritas.Models.Entities;
using Caritas.Repository.Extensions;
using Caritas.Service.Mappers;
using Microsoft.AspNetCore.Identity;

namespace Caritas.Service.Services;

public class PerfilService(RoleManager<Perfil> roleManager, UserManager<Usuario> userManager)
{
    public async Task<PagedResponseDto<PerfilDto>> GetPagedAsync(int page, int pageSize)
    {
        var paged = await roleManager.Roles
            .OrderBy(p => p.Name)
            .ToPagedAsync(page, pageSize);

        return new PagedResponseDto<PerfilDto>
        {
            Items = paged.Items.Select(p => p.ToDto()),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task<PerfilDto> GetByIdAsync(int id)
    {
        var perfil = await roleManager.FindByIdAsync(id.ToString())
            ?? throw new KeyNotFoundException($"Perfil com id {id} não encontrado.");

        var dto = perfil.ToDto();
        dto.Permissions = await GetPermissionsAsync(perfil);
        return dto;
    }

    public async Task<PerfilDto> CreateAsync(CreatePerfilDto dto, int currentUserId)
    {
        await EnsurePermissionsWithinScopeAsync(currentUserId, dto.Permissions);

        var existing = await roleManager.FindByNameAsync(dto.Nome);
        if (existing != null)
            throw new ArgumentException($"Já existe um perfil com o nome '{dto.Nome}'.");

        var perfil = new Perfil
        {
            Name = dto.Nome,
            Descricao = dto.Descricao ?? string.Empty,
        };

        var result = await roleManager.CreateAsync(perfil);
        if (!result.Succeeded)
            throw new ArgumentException(string.Join(", ", result.Errors.Select(e => e.Description)));

        await SyncPermissionsAsync(perfil, dto.Permissions);

        var mapped = perfil.ToDto();
        mapped.Permissions = await GetPermissionsAsync(perfil);
        return mapped;
    }

    public async Task<PerfilDto> UpdateAsync(int id, UpdatePerfilDto dto, int currentUserId)
    {
        var perfil = await roleManager.FindByIdAsync(id.ToString())
            ?? throw new KeyNotFoundException($"Perfil com id {id} não encontrado.");

        if (perfil.Estatico)
            throw new InvalidOperationException("Perfis estáticos não podem ser editados.");

        await EnsurePermissionsWithinScopeAsync(currentUserId, dto.Permissions);

        if (!string.Equals(perfil.Name, dto.Nome, StringComparison.OrdinalIgnoreCase))
        {
            var existing = await roleManager.FindByNameAsync(dto.Nome);
            if (existing != null)
                throw new ArgumentException($"Já existe um perfil com o nome '{dto.Nome}'.");
        }

        perfil.Name = dto.Nome;
        perfil.Descricao = dto.Descricao ?? string.Empty;

        var result = await roleManager.UpdateAsync(perfil);
        if (!result.Succeeded)
            throw new ArgumentException(string.Join(", ", result.Errors.Select(e => e.Description)));

        await SyncPermissionsAsync(perfil, dto.Permissions);

        var mapped = perfil.ToDto();
        mapped.Permissions = await GetPermissionsAsync(perfil);
        return mapped;
    }

    public async Task DeleteAsync(int id)
    {
        var perfil = await roleManager.FindByIdAsync(id.ToString())
            ?? throw new KeyNotFoundException($"Perfil com id {id} não encontrado.");

        if (perfil.Estatico)
            throw new InvalidOperationException("Perfis estáticos não podem ser excluídos.");

        var usersInRole = await userManager.GetUsersInRoleAsync(perfil.Name!);
        if (usersInRole.Count > 0)
            throw new InvalidOperationException(
                "Não é possível excluir um perfil que possui usuários associados.");

        var result = await roleManager.DeleteAsync(perfil);
        if (!result.Succeeded)
            throw new ArgumentException(string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    public async Task<HashSet<string>> GetUserPermissionsAsync(Usuario usuario)
    {
        if (usuario.UsuarioAdmin)
            return PermissionService.AllValues.ToHashSet();

        var permissions = new HashSet<string>();
        foreach (var roleName in await userManager.GetRolesAsync(usuario))
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role != null)
                permissions.UnionWith(await GetPermissionsAsync(role));
        }

        return permissions;
    }

    public async Task<List<SelectObjectDto>> GetAssignableSelectAsync(int currentUserId)
    {
        var currentUser = await userManager.FindByIdAsync(currentUserId.ToString());
        var allowed = await GetUserPermissionsAsync(currentUser!);

        var result = new List<SelectObjectDto>();
        foreach (var role in roleManager.Roles.ToList())
        {
            var rolePermissions = await GetPermissionsAsync(role);
            if (rolePermissions.All(allowed.Contains))
                result.Add(new SelectObjectDto { Value = role.Id, Label = role.Name });
        }

        return result.OrderBy(r => r.Label).ToList();
    }

    public async Task AssignRoleAsync(Usuario usuario, int? perfilId, int currentUserId)
    {
        var currentRoles = await userManager.GetRolesAsync(usuario);

        if (perfilId is null)
        {
            if (currentRoles.Count > 0)
                await userManager.RemoveFromRolesAsync(usuario, currentRoles);
            return;
        }

        var role = await roleManager.FindByIdAsync(perfilId.Value.ToString())
            ?? throw new KeyNotFoundException($"Perfil com id {perfilId} não encontrado.");

        await EnsureCanAssignAsync(currentUserId, role);

        if (currentRoles.Count == 1 && currentRoles[0] == role.Name)
            return;

        if (currentRoles.Count > 0)
            await userManager.RemoveFromRolesAsync(usuario, currentRoles);

        await userManager.AddToRoleAsync(usuario, role.Name!);
    }

    public async Task EnsureCanAssignAsync(int currentUserId, Perfil role)
    {
        var currentUser = await userManager.FindByIdAsync(currentUserId.ToString());

        if (currentUser!.UsuarioAdmin)
            return;

        var allowed = await GetUserPermissionsAsync(currentUser!);
        var rolePermissions = await GetPermissionsAsync(role);

        if (!rolePermissions.All(allowed.Contains))
            throw new InvalidOperationException(
                "Você não pode atribuir um perfil com mais permissões do que as suas.");
    }

    public async Task EnsureCanAssignAsync(int currentUserId, int perfilId)
    {
        var role = await roleManager.FindByIdAsync(perfilId.ToString())
            ?? throw new KeyNotFoundException($"Perfil com id {perfilId} não encontrado.");
        await EnsureCanAssignAsync(currentUserId, role);
    }

    private async Task EnsurePermissionsWithinScopeAsync(int currentUserId, IEnumerable<string>? desiredPermissions)
    {
        var currentUser = await userManager.FindByIdAsync(currentUserId.ToString())
            ?? throw new KeyNotFoundException("Usuário atual não encontrado.");

        if (currentUser.UsuarioAdmin)
            return;

        var allowed = await GetUserPermissionsAsync(currentUser);
        var desired = (desiredPermissions ?? Enumerable.Empty<string>())
            .Where(p => PermissionService.AllValues.Contains(p));

        if (!desired.All(allowed.Contains))
            throw new InvalidOperationException(
                "Você não pode atribuir a um perfil permissões além das suas próprias.");
    }

    private async Task<List<string>> GetPermissionsAsync(Perfil perfil)
    {
        var claims = await roleManager.GetClaimsAsync(perfil);
        return claims
            .Where(c => c.Type == Permissions.ClaimType)
            .Select(c => c.Value)
            .ToList();
    }

    private async Task SyncPermissionsAsync(Perfil perfil, IEnumerable<string>? permissions)
    {
        var desired = (permissions ?? Enumerable.Empty<string>())
            .Where(p => PermissionService.AllValues.Contains(p))
            .Distinct()
            .ToHashSet();

        var permissionClaims = (await roleManager.GetClaimsAsync(perfil))
            .Where(c => c.Type == Permissions.ClaimType)
            .ToList();

        foreach (var claim in permissionClaims.Where(c => !desired.Contains(c.Value)))
            await roleManager.RemoveClaimAsync(perfil, claim);

        var current = permissionClaims.Select(c => c.Value).ToHashSet();
        foreach (var value in desired.Where(v => !current.Contains(v)))
            await roleManager.AddClaimAsync(perfil, new Claim(Permissions.ClaimType, value));
    }
}
