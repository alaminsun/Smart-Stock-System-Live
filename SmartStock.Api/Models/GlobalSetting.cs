using System.ComponentModel.DataAnnotations;

namespace SmartStock.Api.Models
{
    public class GlobalSetting
    {
        [Key]
        public string Key { get; set; } = string.Empty; // e.g., "CompanyName", "CurrencySymbol", "VatPercentage"
        public string Value { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Group { get; set; } // e.g., "Company", "Finance", "Invoice"
    }
}
