using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Caritas.Service.Services;
namespace Caritas.WebApi.Controllers;

public class AuthController(
    UserManager<Usuario> _userManager,
    IConfiguration configuration) : BaseApiController
{

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CadastroDto dto)
    {
        var usuario = new Usuario
        {
            UserName  = dto.Email,
            Email     = dto.Email,
            Nome      = dto.Nome,
            Sobrenome = dto.Sobrenome,
            Cpf       = dto.Cpf,
            Telefone  = dto.Telefone,
            Ativo     = true,
            CriadoEm  = DateTime.UtcNow
        };

        var resultado = await _userManager.CreateAsync(usuario, dto.Password);

        if (!resultado.Succeeded)
            return BadRequest(resultado.Errors);

        return CreatedAtAction(nameof(Register), new { id = usuario.Id }, new
        {
            usuario.Id,
            usuario.Nome,
            usuario.Sobrenome,
            usuario.Email
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var usuario = await _userManager.FindByEmailAsync(dto.Email);
        if (usuario is null || !await _userManager.CheckPasswordAsync(usuario, dto.Password))
            return Unauthorized(new { mensagem = "Email ou senha inválidos." });

        if (!usuario.Ativo)
            return Unauthorized(new { mensagem = "Usuário inativo." });

        var token = GenerateToken(usuario);
        return Ok(new { token });
    }

    private string GenerateToken(Usuario usuario)
    {
        var jwtKey = configuration["Jwt:Key"]!;
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email!),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             configuration["Jwt:Issuer"],
            audience:           configuration["Jwt:Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}