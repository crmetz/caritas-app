using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Authentication
{
    public class ChangePasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string NewPassword { get; set; }
    }
}