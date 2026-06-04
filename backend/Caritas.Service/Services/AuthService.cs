using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Caritas.Service.Services;

public class AuthService(
    UserManager<Usuario> userManager,
    CaritasDbContext context,
    IConfiguration configuration)
{
    public async Task<(bool Success, IEnumerable<string> Errors, Usuario? Usuario, string? resetToken)> RegisterAsync(CadastroDto dto)
    {
        var usuario = new Usuario
        {
            UserName = dto.Email,
            Email = dto.Email,
            Nome = dto.Nome,
            Sobrenome = dto.Sobrenome,
            Cpf = dto.Cpf,
            Telefone = dto.Telefone,
            Ativo = true,
            CriadoEm = DateTime.UtcNow,
            UsuarioParoquias = new List<UsuarioParoquia>()
        };

        if (dto.ParoquiasPermitidas != null)
        {
            foreach (var paroquiaId in dto.ParoquiasPermitidas)
            {
                usuario.UsuarioParoquias.Add(new UsuarioParoquia { ParoquiaId = paroquiaId });
            }
        }

        var tempPassword = "Senhatemp"; //mudar pra gerador de senha
        var passwordToUse = string.IsNullOrWhiteSpace(dto.Password)
        ? tempPassword
        : dto.Password;

        var resultado = await userManager.CreateAsync(usuario, passwordToUse);

        if (!resultado.Succeeded)
            return (false, resultado.Errors.Select(e => e.Description), null, null);

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(usuario);

        return (true, Enumerable.Empty<string>(), usuario, resetToken);
    }

    public async Task<(bool Success, string? Token, string? Error)> LoginAsync(LoginDto dto)
    {
        var usuario = await userManager.FindByEmailAsync(dto.Email);

        if (usuario is null || !await userManager.CheckPasswordAsync(usuario, dto.Password))
            return (false, null, "Email ou senha inválidos.");

        if (!usuario.Ativo)
            return (false, null, "Usuário inativo.");

        var token = GenerateToken(usuario);
        return (true, token, null);
    }

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