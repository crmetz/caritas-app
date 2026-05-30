using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Authentication
{
    public class LoginDto
    {
        [Required]
        public string Email { get; set; }

        [Required]
        [EmailAddress]
        public string Password { get; set; }
    }
}
