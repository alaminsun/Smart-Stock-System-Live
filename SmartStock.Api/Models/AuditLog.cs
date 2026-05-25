using System.ComponentModel.DataAnnotations;

namespace SmartStock.Api.Models
{
    public class AuditLog
    {
        [Key]
        public Guid Id { get; set; }

        public string? UserId { get; set; }       // কে পরিবর্তন করেছে (Email/Username)
        public string Action { get; set; } = string.Empty; // Create, Update, Delete
        public string TableName { get; set; } = string.Empty; // কোন টেবিলে (e.g., Products)
        public string PrimaryKey { get; set; } = string.Empty; // ওই রো-এর আইডি কত ছিল

        public string? OldValues { get; set; }     // পরিবর্তনের আগের ডাটা (JSON Format)
        public string? NewValues { get; set; }     // পরিবর্তনের পরের ডাটা (JSON Format)

        public DateTime Timestamp { get; set; } = DateTime.UtcNow; // কখন হয়েছে
    }
}
