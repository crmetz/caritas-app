using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Services.Email.Templates;
using Microsoft.AspNetCore.Authorization;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class AuthController(
    UserManager<Usuario> userManager,
    CaritasDbContext context,
    IEmailService emailService,
    IConfiguration configuration) : BaseApiController
{
    private readonly AuthService _authService = new(userManager, context, configuration);

    [AllowAnonymous]
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

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string userEmail)
    {
        var token = await _authService.GeneratePasswordResetTokenAsync(userEmail);

        if (!String.IsNullOrEmpty(token))
        {
            await emailService.SendAsync(userEmail, "Recuperação de senha", PasswordRecoverEmail.Build(token));
        }

        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {   
        dto.Token = Uri.UnescapeDataString(dto.Token);
        var result = await _authService.ResetPasswordAsync(dto);

        if (!result.Success)
            return BadRequest(new { erros = result.Errors });

        return NoContent();
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var result = await _authService.ChangePasswordAsync(dto);

        if (!result.Success)
            return BadRequest(new { erros = result.Errors });

        return NoContent();
    }
}