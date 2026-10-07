using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Caritas.Models.Constants;
using Caritas.Models.Exceptions;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.WebApi.Middleware;

// Valida que o usuário autenticado tem acesso à paróquia do header X-Paroquia-Id.
// Só a paróquia validada chega à aplicação, via HttpContext.Items.
public class ParoquiaAtualMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, CaritasDbContext db)
    {
        var header = context.Request.Headers[SessionKeys.ParoquiaHeader].FirstOrDefault();
        if (string.IsNullOrEmpty(header) || context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        if (!int.TryParse(header, out var paroquiaId))
            throw new ArgumentException($"Header {SessionKeys.ParoquiaHeader} inválido.");

        var userValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!int.TryParse(userValue, out var usuarioId))
            throw new UnauthorizedAccessException("Usuário não autenticado.");

        var isAdmin = await db.Users
            .Where(u => u.Id == usuarioId)
            .Select(u => u.UsuarioAdmin)
            .FirstOrDefaultAsync();

        var temAcesso = isAdmin
            ? await db.Paroquias.AnyAsync(p => p.Id == paroquiaId)
            : await db.UsuarioParoquias.AnyAsync(up => up.UsuarioId == usuarioId && up.ParoquiaId == paroquiaId);

        if (!temAcesso)
            throw new ForbiddenException("Usuário sem acesso à paróquia informada.");

        context.Items[SessionKeys.ParoquiaAtualId] = paroquiaId;
        await next(context);
    }
}
