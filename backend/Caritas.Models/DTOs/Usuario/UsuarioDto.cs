using Caritas.Models.DTOs.Common;
namespace Caritas.Models.DTOs.Usuario
{

    public class UsuarioDto : EntityDto
    {
        public string Nome { get; set; }
        public string Sobrenome { get; set; }
        public string Email { get; set; }
        public string? Cpf { get; set; }
        public string? Telefone { get; set; }
        public DateOnly? DataNasc { get; set; }
        public int? PerfilId { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime? AtualizadoEm { get; set; }
    };
}