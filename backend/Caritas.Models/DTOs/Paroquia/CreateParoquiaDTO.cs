using Caritas.Models.DTOs.Endereço;
using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Paroquia
{
    public class CreateParoquiaDTO
    {
        [Required(ErrorMessage = "O nome da paróquia é obrigatório.")]
        public string? Nome { get; set; }

        [Required]
        public EnderecoDto? Endereco { get; set; }
    }
}