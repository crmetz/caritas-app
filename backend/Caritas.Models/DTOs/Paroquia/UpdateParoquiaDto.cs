using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Endereço;

namespace Caritas.Models.DTOs.Paroquia
{
    public class UpdateParoquiaDto
    {
        public string? Nome {  get; set; }
        public EnderecoDto? Endereco { get; set; }
    }
}
