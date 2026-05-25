namespace SmartStock.Api.Models;

public class Invoice
{
    public Guid Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public Guid CustomerId { get; set; }
    public virtual Customer? Customer { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal Discount { get; set; }
    public decimal NetAmount { get; set; } // Total - Discount
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public string? CreatedBy { get; set; }
    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
}
