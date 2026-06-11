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
    private readonly AuthService _authService = new(userManager, context, configuration, emailService);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CadastroDto dto)
    {
        var usuario = await _authService.RegisterAsync(dto);
        return CreatedAtAction(nameof(Register), new { id = usuario.Id }, usuario);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        return Ok(result);
    }

    [HttpGet("session")]
    public async Task<IActionResult> Session()
    {
        var result = await _authService.GetSessionAsync(UsuarioId);

        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var token = await _authService.GeneratePasswordResetTokenAsync(dto.Email);

        if (!string.IsNullOrEmpty(token))
        {
            var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
            var link = $"{frontendUrl}/redefinir-senha?email={Uri.EscapeDataString(dto.Email)}&token={Uri.EscapeDataString(token)}";
            await emailService.SendAsync(dto.Email, PasswordRecoverEmail.Subject, PasswordRecoverEmail.Build(link));
        }

        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        await _authService.ResetPasswordAsync(dto);
        return NoContent();
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        await _authService.ChangePasswordAsync(dto);   

        return NoContent();
    }
}