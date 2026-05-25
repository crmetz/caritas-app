using Caritas.Models.DTOs.Endereço;

namespace Caritas.Models.DTOs.Paroquia
{
    public class CreateParoquiaDTO
    {
        public string? Nome { get; set; }
        public EnderecoDto? Endereco { get; set; }
    }
}