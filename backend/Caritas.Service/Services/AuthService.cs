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
using Caritas.Models.Constants;
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

        var token = await GenerateTokenAsync(usuario);
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
            ParoquiasPermitidas = paroquias,
        };
    }

    public async Task<String> GeneratePasswordResetTokenAsync(string userEmail)
    {
        var user = await userManager.FindByEmailAsync(userEmail);

        if(user == null)
        {
            return null;
        }

        return await userManager.GeneratePasswordResetTokenAsync(user);
    }
    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);

        if(user == null)
        {
            throw new KeyNotFoundException("Usuário não encontrado");
        }

        var result = await userManager.ResetPasswordAsync(user, dto.Token, dto.Password);

        if (!result.Succeeded)
        {
            throw new Exception("Erro ao resetar senha: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }

    }

    public async Task  ChangePasswordAsync(ChangePasswordDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);

        if(user == null)
        {
            throw new KeyNotFoundException("Usuário não encontrado");
        }

        var result = await userManager.ChangePasswordAsync(user, dto.Password, dto.NewPassword);

        if (!result.Succeeded)
        {
            throw new Exception("Erro ao alterar senha: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    private async Task<string> GenerateTokenAsync(Usuario usuario)
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

        if (usuario.UsuarioAdmin)
        {
            claims.AddRange(PermissionService.AllValues
                .Select(p => new Claim(Permissions.ClaimType, p)));
        }
        else
        {
            var roleName = (await userManager.GetRolesAsync(usuario)).FirstOrDefault();
            if (roleName != null)
            {
                var role = await roleManager.FindByNameAsync(roleName);
                if (role != null)
                    claims.AddRange(await roleManager.GetClaimsAsync(role));
            }
        }

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateTemporaryPassword()
{
    const string letrasUpper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const string letrasLower = "abcdefghijkmnpqrstuvwxyz";
    const string numeros     = "23456789";
    const string especiais   = "!@$?_-";
    const string todos       = letrasUpper + letrasLower + numeros + especiais;

    var bytes = RandomNumberGenerator.GetBytes(12);
    var senha = new char[12];

    // garante ao menos um de cada tipo exigido
    senha[0] = letrasUpper[bytes[0] % letrasUpper.Length];
    senha[1] = numeros[bytes[1] % numeros.Length];
    senha[2] = especiais[bytes[2] % especiais.Length];

    for (int i = 3; i < 12; i++)
        senha[i] = todos[bytes[i] % todos.Length];

    // embaralha pra não ter padrão fixo nos primeiros caracteres
    return new string(senha.OrderBy(_ => RandomNumberGenerator.GetInt32(100)).ToArray());
}
}