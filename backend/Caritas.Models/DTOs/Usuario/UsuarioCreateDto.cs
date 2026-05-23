namespace Caritas.Models.DTOs.Usuario;

public record UsuarioCreateDto(
    string Nome,
    string Sobrenome,
    string Email,
    string Senha,
    string? Telefone,
    string? DataNascimento,
    int? IdParoquia,
    int? IdPerfil
);