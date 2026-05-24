using Caritas.Models.Entities;

namespace Caritas.Models.DTOs.Paroquia
{
    public record ParoquiaCreateDTO
    (
        string Nome,
        Endereco? Endereco
    );
}
