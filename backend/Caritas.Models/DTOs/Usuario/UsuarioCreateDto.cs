namespace Caritas.Models.DTOs.Usuario;

public record UsuarioCreateDto(
    string Nome,
    string Sobrenome,
    string Email,
    string Senha,
    string? Cpf,
    string? Telefone,
    DateTime? DataNasc,
    int? PerfilId
);