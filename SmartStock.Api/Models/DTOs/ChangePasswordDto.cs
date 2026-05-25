using System.ComponentModel.DataAnnotations;

namespace SmartStock.Api.Models.DTOs
{
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare("NewPassword", ErrorMessage = "Confirm password must match New Password")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
