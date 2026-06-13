
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
        public DateOnly? DataNasc { get; set; }
        public string? Cpf { get; set; }
        public string? Telefone { get; set; }
        public int? PerfilId { get; set; }
        public List<int>? ParoquiasPermitidas { get; set; }
    }
}