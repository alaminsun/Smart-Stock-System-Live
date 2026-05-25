namespace SmartStock.Api.Models
{
    public class InventoryTransaction
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; } // কোন পণ্য?
        public virtual Product? Product { get; set; }

        public Guid? SupplierId { get; set; } // অবশ্যই Guid হতে হবে
        public virtual Supplier? Supplier { get; set; }

        public Guid? CustomerId { get; set; } // Stock Out এর জন্য এটি লাগবে
        public virtual Customer? Customer { get; set; }

        public int Quantity { get; set; } // কতটুকু?
        public string TransactionType { get; set; } = string.Empty;// "StockIn" অথবা "StockOut"

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        public string? Remarks { get; set; } // কেন আনা হলো বা কোথায় পাঠানো হলো?
        public string? UserId { get; set; } // কে এই এন্ট্রি দিল?
    }
}
