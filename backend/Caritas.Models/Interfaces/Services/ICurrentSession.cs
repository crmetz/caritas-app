namespace Caritas.Models.Interfaces.Services;

/// <summary>
/// Informações da sessão atual (usuário autenticado e paróquia selecionada),
/// acessíveis a partir de qualquer camada via injeção de dependência.
/// Vive em Caritas.Models para que a camada Repository (DbContext) também possa consumi-la.
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
