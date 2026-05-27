namespace SmartStock.Api.Models.DTOs
{
    public class MenuDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Link { get; set; }
        public string? Permission { get; set; }
        public int? ParentId { get; set; } // ফ্রন্টএন্ডের parentId এখানে ম্যাপ হবে
        public int DisplayOrder { get; set; }
    }
}
