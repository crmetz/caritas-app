namespace Caritas.Models.Constants;

public static class SessionKeys
{
    public const string ParoquiaHeader = "X-Paroquia-Id";

    // Chave em HttpContext.Items com a paróquia do header já validada pelo ParoquiaAtualMiddleware.
    public const string ParoquiaAtualId = "ParoquiaAtualId";
}
