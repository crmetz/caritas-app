using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Services.Email.Templates;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using Caritas.Models.DTOs.Usuario;
using Caritas.Service.Mappers;
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
    private readonly PerfilService _perfilService = new(roleManager, userManager);

    public async Task<UsuarioDto> RegisterAsync(CadastroDto dto, int currentUserId)
    {
        var existente = await userManager.FindByEmailAsync(dto.Email);
        if (existente is not null)
            throw new ArgumentException($"Já existe um usuário cadastrado com o e-mail '{dto.Email}'.");

        // Valida a atribuição do perfil antes de criar o usuário (evita usuário órfão).
        if (dto.PerfilId is not null)
            await _perfilService.EnsureCanAssignAsync(currentUserId, dto.PerfilId.Value);

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

        var tempPassword = "SenhaTemp@123"; //GenerateTemporaryPassword();

        var resultado = await userManager.CreateAsync(usuario, tempPassword);

        if (!resultado.Succeeded)
            throw new Exception("Erro ao criar usuário: " + string.Join(", ", resultado.Errors.Select(e => e.Description)));

        await _perfilService.AssignRoleAsync(usuario, dto.PerfilId, currentUserId);

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(usuario);
        var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
        var link = $"{frontendUrl}/redefinir-senha?email={Uri.EscapeDataString(usuario.Email!)}&token={Uri.EscapeDataString(resetToken)}";
        await emailService.SendAsync(usuario.Email!, FirstAccessEmail.Subject, FirstAccessEmail.Build(usuario.Nome!, link));

        return usuario.ToDto();
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
            Token = token
        };
    }

    public async Task<SessionDto> GetSessionAsync(int usuarioId)
    {
        var usuario = await userManager.FindByIdAsync(usuarioId.ToString())
            ?? throw new KeyNotFoundException("Usuário não encontrado.");

        var isAdmin = await userManager.IsInRoleAsync(usuario, PerfisPadrao.Admin);

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