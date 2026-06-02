using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;

namespace SmartStock.Api.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IRepository<Invoice> _invoiceRepository;
        private readonly IRepository<Product> _productRepository;
        private readonly SmartStock.Api.Data.AppDbContext _context;

        public InvoiceService(
            IRepository<Invoice> invoiceRepository, 
            IRepository<Product> productRepository,
            SmartStock.Api.Data.AppDbContext context)
        {
            _invoiceRepository = invoiceRepository;
            _productRepository = productRepository;
            _context = context;
        }

        public async Task<Invoice> CreateInvoiceAsync(Invoice invoice)
        {
            invoice.Id = Guid.NewGuid();
            invoice.InvoiceDate = DateTime.UtcNow;

            // ডাইনামিক ট্যাক্স এবং প্রিফিক্স নেওয়া
            var settings = await _context.GlobalSettings.ToListAsync();
            var taxRateStr = settings.FirstOrDefault(s => s.Key == "VatPercentage")?.Value ?? "0";
            var prefix = settings.FirstOrDefault(s => s.Key == "InvoicePrefix")?.Value ?? "INV";

            decimal.TryParse(taxRateStr, out decimal currentTaxRate);

            invoice.TaxRate = currentTaxRate;
            invoice.TaxAmount = (invoice.TotalAmount * currentTaxRate) / 100;
            invoice.NetAmount = (invoice.TotalAmount + invoice.TaxAmount) - invoice.Discount;

            var count = await _invoiceRepository.CountAsync();
            invoice.InvoiceNo = $"{prefix}-{DateTime.Now.Year}-{count + 1001}";

            foreach (var item in invoice.InvoiceItems)
            {
                item.Id = Guid.NewGuid();
                item.InvoiceId = invoice.Id;

                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product != null)
                {
                    if (product.Quantity < item.Quantity)
                        throw new Exception($"Stock insufficient for {product.Name}");

                    product.Quantity -= item.Quantity;
                    await _productRepository.UpdateAsync(product);
                }
            }

            var created = await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();
            return created;
        }

        public async Task<IEnumerable<Invoice>> GetAllInvoicesAsync()
        {
            return await _invoiceRepository.Query()
                .Include(i => i.Customer)
                .OrderByDescending(i => i.InvoiceDate)
                .ToListAsync();
        }

        public async Task<Invoice?> GetInvoiceByIdAsync(Guid id)
        {
            return await _invoiceRepository.Query()
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<bool> DeleteInvoiceAsync(Guid id)
        {
            var invoice = await _invoiceRepository.Query()
                .Include(i => i.InvoiceItems)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return false;

            foreach (var item in invoice.InvoiceItems)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product != null)
                {
                    product.Quantity += item.Quantity;
                    await _productRepository.UpdateAsync(product);
                }
            }

            await _invoiceRepository.DeleteAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();
            return true;
        }
    }
}
