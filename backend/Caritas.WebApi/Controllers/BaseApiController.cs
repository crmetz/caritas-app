using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Caritas.Models.Constants;
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

    /// <summary>Paróquia selecionada pelo front (header X-Paroquia-Id), já validada pelo ParoquiaAtualMiddleware.</summary>
    protected int? ParoquiaAtualId => HttpContext.Items[SessionKeys.ParoquiaAtualId] as int?;
}
