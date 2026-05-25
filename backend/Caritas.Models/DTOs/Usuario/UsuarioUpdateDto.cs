namespace Caritas.Models.DTOs.Usuario;

public record UsuarioUpdateDto(
    string? Nome,
    string? Sobrenome,
    string? Telefone,
    DateTime? DataNasc,
    int? PerfilId
);