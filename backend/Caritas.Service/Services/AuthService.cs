using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Paroquia;
using Microsoft.EntityFrameworkCore;
namespace Caritas.Service.Services;

public class AuthService(
    UserManager<Usuario> userManager,
    RoleManager<Perfil> roleManager,
    CaritasDbContext context,
    IConfiguration configuration,
    IEmailService emailService)
{
    public async Task<LoginResponseDto> LoginAsync(LoginDto dto)
    {
        var usuario = await userManager.FindByEmailAsync(dto.Email);

        if (usuario is null || !await userManager.CheckPasswordAsync(usuario, dto.Password))
            throw new UnauthorizedAccessException("Email ou senha incorretos.");

        if (!usuario.Ativo)
            throw new UnauthorizedAccessException("Usuário inativo. Contate o administrador.");

        var token = GenerateToken(usuario);
        return new LoginResponseDto
        {
            Token = token
        };
    }

    public async Task<SessionDto> GetSessionAsync(int usuarioId)
    {
        var usuario = await userManager.FindByIdAsync(usuarioId.ToString())
            ?? throw new KeyNotFoundException("Usuário não encontrado.");

        var isAdmin = usuario.UsuarioAdmin;

        var permissions = await new PerfilService(roleManager, userManager)
            .GetUserPermissionsAsync(usuario);

        var paroquias = isAdmin
            ? await context.Paroquias
                .OrderByDescending(p => p.Raiz)
                .ThenBy(p => p.Nome)
                .Select(p => new ParoquiaSelectObjectDto { Value = p.Id, Label = p.Nome, Raiz = p.Raiz })
                .ToListAsync()
            : await context.UsuarioParoquias
                .Where(up => up.UsuarioId == usuario.Id)
                .OrderByDescending(up => up.Paroquia!.Raiz)
                .ThenBy(up => up.Paroquia!.Nome)
                .Select(up => new ParoquiaSelectObjectDto { Value = up.ParoquiaId, Label = up.Paroquia!.Nome, Raiz = up.Paroquia!.Raiz })
                .ToListAsync();

        return new SessionDto
        {
            Id = usuario.Id,
            Nome = usuario.Nome,
            Sobrenome = usuario.Sobrenome,
            Email = usuario.Email,
            IsAdmin = isAdmin,
            Permissions = permissions.ToList(),
            ParoquiasPermitidas = paroquias,
        };
    }

    public async Task<String> GeneratePasswordResetTokenAsync(string userEmail)
    {
        var user = await userManager.FindByEmailAsync(userEmail);

        if (user == null)
        {
            return null;
        }

        return await userManager.GeneratePasswordResetTokenAsync(user);
    }
    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);

        if (user == null)
        {
            throw new KeyNotFoundException("Usuário não encontrado");
        }

        var result = await userManager.ResetPasswordAsync(user, dto.Token, dto.Password);

        if (!result.Succeeded)
        {
            throw new Exception("Erro ao resetar senha: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }

    }

    public async Task ChangePasswordAsync(ChangePasswordDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);

        if (user == null)
        {
            throw new KeyNotFoundException("Usuário não encontrado");
        }

        var result = await userManager.ChangePasswordAsync(user, dto.Password, dto.NewPassword);

        if (!result.Succeeded)
        {
            throw new Exception("Erro ao alterar senha: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    // TODO: quando refresh token for implementado, incluir as permission claims aqui
    // e remover a consulta ao banco no PermissionAuthorizationHandler
    private string GenerateToken(Usuario usuario)
    {
        var jwtKey = configuration["Jwt:Key"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email!),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}