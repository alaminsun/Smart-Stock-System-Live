using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartStock.Api.Models
{
    public class Product
    {
        public Guid Id { get; set; }
        [Required(ErrorMessage = "Product name is required")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        [Required]
        [Range(0.01, 1000000, ErrorMessage = "Cost price must be greater than 0")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; } // কেনা দাম

        [Required]
        [Range(0.01, 1000000, ErrorMessage = "Sale price must be greater than 0")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal SalePrice { get; set; } // বিক্রয় মূল্য (এটিই এখন আপনার মেইন Price)
        [Required]
        public string SKU { get; set; } = string.Empty; // পার্টস নম্বর
        public string? Description { get; set; }
        [Range(1, 10000, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; } // Current Stock
        [Range(5, 1000, ErrorMessage = "Min stock level must be at least 5")]
        public int MinStockLevel { get; set; } // Business Alert Trigger
        // Foreign Key for Category
        public int CategoryId { get; set; }
        public virtual Category? Category { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
