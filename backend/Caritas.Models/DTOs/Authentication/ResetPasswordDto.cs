using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Authentication
{
    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Token { get; set; }
        [Required]
        public string Password { get; set; }
    }
}
