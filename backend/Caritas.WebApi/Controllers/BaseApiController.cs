using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>Id do usuário autenticado, lido do claim do token JWT.</summary>
    protected int UsuarioId =>
        int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new UnauthorizedAccessException("Usuário não autenticado."));

    /// <summary>Paróquia atualmente selecionada pelo front, atualmente enviada no header.</summary>
    protected int? ParoquiaAtualId =>
        int.TryParse(Request.Headers["X-Paroquia-Id"], out var id) ? id : null;
}
