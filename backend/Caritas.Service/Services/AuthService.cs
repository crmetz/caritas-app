using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using Caritas.Models.DTOs.Usuario;
using Caritas.Service.Mappers;
namespace Caritas.Service.Services;

public class AuthService(
    UserManager<Usuario> userManager,
    CaritasDbContext context,
    IConfiguration configuration)
{
    public async Task<(UsuarioDto Usuario, string? resetToken)> RegisterAsync(CadastroDto dto)
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

        var tempPassword = "Senhatemp123"; //GenerateTemporaryPassword()

        var resultado = await userManager.CreateAsync(usuario, tempPassword);

        if (!resultado.Succeeded)
            throw new Exception("Erro ao criar usuário: " + string.Join(", ", resultado.Errors.Select(e => e.Description)));

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(usuario);

        return (usuario.ToDto(), resetToken);
    }

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
            Nome = usuario.Nome,
            Sobrenome = usuario.Sobrenome,
            Token = token
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