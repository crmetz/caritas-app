using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Services.Email.Templates;
using Caritas.WebApi.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class AuthController(
    UserManager<Usuario> userManager,
    RoleManager<Perfil> roleManager,
    CaritasDbContext context,
    IEmailService emailService,
    IConfiguration configuration) : BaseApiController
{
    private readonly AuthService _authService = new(userManager, roleManager, context, configuration, emailService);

    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
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
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var token = await _authService.GeneratePasswordResetTokenAsync(dto.Email);

        if (!string.IsNullOrEmpty(token))
        {
            // Checa vazio, não só null: em container a variável costuma chegar como
            // string vazia quando não é preenchida, e "??" não pegaria esse caso.
            var frontendUrl = configuration["FrontendUrl"] is { Length: > 0 } url
                ? url.TrimEnd('/')
                : "http://localhost:5173";
            var link = $"{frontendUrl}/redefinir-senha?email={Uri.EscapeDataString(dto.Email)}&token={Uri.EscapeDataString(token)}";
            await emailService.SendAsync(dto.Email, PasswordRecoverEmail.Subject, PasswordRecoverEmail.Build(link));
        }

        return NoContent();
    }

    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
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