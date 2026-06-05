using Caritas.Models.DTOs.Authentication;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Services.Email.Templates;

namespace Caritas.WebApi.Controllers;

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
        var (success, token, error) = await _authService.LoginAsync(dto);

        if (!success)
            return Unauthorized(new { mensagem = error });

        return Ok(new { token });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string userEmail)
    {
        var token = await _authService.GeneratePasswordResetTokenAsync(userEmail);

        if (String.IsNullOrEmpty(token))
            return NoContent();    

        await emailService.SendAsync(userEmail, "Recuperação de senha", PasswordRecoverEmail.Build(token));

        return NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {   
        dto.Token = Uri.UnescapeDataString(dto.Token);
        var resultado = await _authService.ResetPasswordAsync(dto);

        if (!resultado.Succeeded)
            return BadRequest(new { erros = resultado.Errors.Select(e => e.Description) });

        return NoContent();
    }
}