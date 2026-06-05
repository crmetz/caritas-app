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

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CadastroDto dto)
    {
        var (usuario, resetToken) = await _authService.RegisterAsync(dto);


        return CreatedAtAction(nameof(Register), new { usuario, resetToken});
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