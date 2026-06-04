
using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Authentication
{
    public class CadastroDto
    {
        [Required]
        public string Nome { get; set; }
        [Required]
        public string Sobrenome { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        public string? Cpf { get; set; }
        public string? Telefone { get; set; }
        public List<int>? ParoquiasPermitidas { get; set; }
    }
}