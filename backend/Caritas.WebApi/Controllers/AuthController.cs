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
        var (success, errors, usuario, resetToken) = await _authService.RegisterAsync(dto);

        if (!success)
            return BadRequest(new { erros = errors });

        return CreatedAtAction(nameof(Register), new { id = usuario!.Id }, new
        {
            usuario.Id,
            usuario.Nome,
            usuario.Sobrenome,
            usuario.Email,
            ParoquiasPermitidas = usuario.UsuarioParoquias.Select(up => up.ParoquiaId),
            ResetToken = resetToken
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        return Ok(result);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var usuario = await userManager.FindByEmailAsync(dto.Email);


        if (usuario is null)
            return NoContent();

        var resultado = await userManager.ResetPasswordAsync(usuario, dto.Token, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new { erros = resultado.Errors.Select(e => e.Description) });

        return NoContent();
    }
}