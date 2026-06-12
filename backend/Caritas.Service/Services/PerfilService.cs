using System.Security.Claims;
using Caritas.Models.Constants;
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

    public async Task<PerfilDto> CreateAsync(CreatePerfilDto dto)
    {
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

    public async Task<PerfilDto> UpdateAsync(int id, UpdatePerfilDto dto)
    {
        var perfil = await roleManager.FindByIdAsync(id.ToString())
            ?? throw new KeyNotFoundException($"Perfil com id {id} não encontrado.");

        if (perfil.Estatico)
            throw new InvalidOperationException("Perfis estáticos não podem ser editados.");

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
