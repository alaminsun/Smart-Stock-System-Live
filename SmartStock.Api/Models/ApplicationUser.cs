using Microsoft.AspNetCore.Identity;

namespace SmartStock.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? ProfilePicture { get; set; }
    }
}
