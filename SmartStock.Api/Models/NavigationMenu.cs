namespace SmartStock.Api.Models
{
    public class NavigationMenu
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Icon { get; set; } // Bootstrap icon class (e.g., bi-box)
        public string? Link { get; set; } // Angular route path
        public string? Permission { get; set; } // Permission string (e.g., Permissions.Products.View)
        public int? ParentId { get; set; } // NULL হলে এটি Level 1 মেনু
        public int DisplayOrder { get; set; } // মেনুর ক্রম সাজানোর জন্য

        // Navigation properties for EF Core
        public virtual NavigationMenu? Parent { get; set; }
        public virtual ICollection<NavigationMenu> Children { get; set; } = new List<NavigationMenu>();
    }
}
