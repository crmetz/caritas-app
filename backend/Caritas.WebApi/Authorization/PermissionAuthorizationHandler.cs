using Caritas.Models.Constants;
using Microsoft.AspNetCore.Authorization;

namespace Caritas.WebApi.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.HasClaim(Permissions.ClaimType, requirement.Permission))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
