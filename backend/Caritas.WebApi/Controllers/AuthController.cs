using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

public class AuthController(
    UserManager<Usuario> userManager,
    CaritasDbContext context,
    IConfiguration configuration) : BaseApiController
{
    private readonly AuthService _authService = new(userManager, context, configuration);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CadastroDto dto)
    {
        var (success, errors, usuario) = await _authService.RegisterAsync(dto);

        if (!success)
            return BadRequest(new { erros = errors });

        return CreatedAtAction(nameof(Register), new { id = usuario!.Id }, new
        {
            usuario.Id,
            usuario.Nome,
            usuario.Sobrenome,
            usuario.Email,
            ParoquiasPermitidas = usuario.UsuarioParoquias.Select(up => up.ParoquiaId)
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var (success, token, error) = await _authService.LoginAsync(dto);

        if (!success)
            return Unauthorized(new { mensagem = error });

        return Ok(new { token });
    }
}