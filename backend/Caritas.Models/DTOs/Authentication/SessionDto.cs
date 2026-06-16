using Caritas.Models.DTOs.Paroquia;

namespace Caritas.Models.DTOs.Authentication
{
    public class SessionDto
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public string? Sobrenome { get; set; }
        public string? Email { get; set; }
        public bool IsAdmin { get; set; }
        public List<string> Permissions { get; set; } = [];
        public List<ParoquiaSelectObjectDto> ParoquiasPermitidas { get; set; } = [];
    }
}
