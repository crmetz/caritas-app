using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Http;

namespace Caritas.Service.Session;

public class CurrentSession(IHttpContextAccessor httpContextAccessor) : ICurrentSession
{
    private HttpContext? Context => httpContextAccessor.HttpContext;

    public int? UsuarioId
    {
        get
        {
            var value = Context?.User.FindFirstValue(ClaimTypes.NameIdentifier)   // "sub" é remapeado p/ NameIdentifier
                ?? Context?.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public int? ParoquiaAtualId
    {
        get
        {
            var header = Context?.Request.Headers["X-Paroquia-Id"].FirstOrDefault();
            return int.TryParse(header, out var id) ? id : null;
        }
    }

    public bool IsAuthenticated => Context?.User.Identity?.IsAuthenticated ?? false;
}
