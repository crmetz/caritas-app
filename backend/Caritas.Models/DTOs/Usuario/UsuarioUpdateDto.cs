namespace Caritas.Models.DTOs.Usuario;

public record UpdateUsuarioDto(
    string? Nome,
    string? Sobrenome,
    string? Telefone,
    string? DataNascimento,
    int? IdParoquia,
    int? IdPerfil
);