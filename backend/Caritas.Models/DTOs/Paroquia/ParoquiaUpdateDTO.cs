using Caritas.Models.Entities;

namespace Caritas.Models.DTOs.Paroquia
{
    public record ParoquiaUpdateDTO
    (
        string Nome,
        Endereco? Endereco,
        ICollection<UsuarioParoquia> UsuarioParoquias
    );
}
