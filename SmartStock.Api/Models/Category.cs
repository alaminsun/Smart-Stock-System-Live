namespace SmartStock.Api.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // Relationship: One category has many products
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
