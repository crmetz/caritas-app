namespace Caritas.WebApi.Authorization;

public static class RateLimitPolicies
{
    /// <summary>
    /// Endpoints anônimos de autenticação (login, recuperação e redefinição de senha).
    /// </summary>
    public const string Auth = "auth";
}
