using Microsoft.AspNetCore.Authorization;

namespace Caritas.WebApi.Authorization;

public record PermissionRequirement(string Permission) : IAuthorizationRequirement;
