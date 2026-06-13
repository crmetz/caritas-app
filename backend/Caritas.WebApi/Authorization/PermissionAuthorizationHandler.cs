using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Caritas.Models.Constants;
using Caritas.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace Caritas.WebApi.Authorization;

// TODO: quando refresh token for implementado, as permissions virão como claims no JWT —
// este handler poderá ser simplificado para context.User.HasClaim(...) sem consulta ao banco
public class PermissionAuthorizationHandler(
    UserManager<Usuario> userManager,
    RoleManager<Perfil> roleManager) : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null) return;

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return;

        if (user.UsuarioAdmin)
        {
            context.Succeed(requirement);
            return;
        }

        var roleName = (await userManager.GetRolesAsync(user)).FirstOrDefault();
        if (roleName is null) return;

        var role = await roleManager.FindByNameAsync(roleName);
        if (role is null) return;

        var claims = await roleManager.GetClaimsAsync(role);
        if (claims.Any(c => c.Type == Permissions.ClaimType && c.Value == requirement.Permission))
            context.Succeed(requirement);
    }
}
