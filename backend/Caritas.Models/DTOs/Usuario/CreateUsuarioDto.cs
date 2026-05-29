using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Usuario
{

    public class CreateUsuarioDto
    {
        [Required]
        [StringLength(50)]
        public string Nome { get; set; }

        [Required]
        [StringLength(50)]
        public string Sobrenome { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }
        public string? Cpf { get; set; }
        public string? Telefone { get; set; }
        public DateOnly? DataNasc { get; set; }
        public int? PerfilId { get; set; }
        public List<int> ParoquiasPermitidas { get; set; } = new List<int>();
    }
}