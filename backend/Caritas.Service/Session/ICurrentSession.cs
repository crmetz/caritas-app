namespace Caritas.Service.Session;

/// <summary>
/// Informações da sessão atual (usuário autenticado e paróquia selecionada),
/// acessíveis a partir de qualquer service via injeção de dependência.
/// </summary>
public interface ICurrentSession
{
    /// <summary>Id do usuário autenticado, lido do token JWT. Null se não autenticado.</summary>
    int? UsuarioId { get; }

    /// <summary>Paróquia atualmente selecionada pelo front (header X-Paroquia-Id). Null se ausente.</summary>
    int? ParoquiaAtualId { get; }

    /// <summary>Indica se há um usuário autenticado na requisição atual.</summary>
    bool IsAuthenticated { get; }
}
