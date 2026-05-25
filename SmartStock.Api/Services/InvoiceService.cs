using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;

namespace SmartStock.Api.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IRepository<Invoice> _invoiceRepository;
        private readonly IRepository<Product> _productRepository;

        public InvoiceService(IRepository<Invoice> invoiceRepository, IRepository<Product> productRepository)
        {
            _invoiceRepository = invoiceRepository;
            _productRepository = productRepository;
        }

        public async Task<Invoice> CreateInvoiceAsync(Invoice invoice)
        {
            invoice.Id = Guid.NewGuid();
            invoice.InvoiceDate = DateTime.UtcNow;

            const decimal CurrentTaxRate = 20.0m;
            invoice.TaxRate = CurrentTaxRate;
            invoice.TaxAmount = (invoice.TotalAmount * CurrentTaxRate) / 100;
            invoice.NetAmount = (invoice.TotalAmount + invoice.TaxAmount) - invoice.Discount;

            var count = await _invoiceRepository.CountAsync();
            invoice.InvoiceNo = $"INV-{DateTime.Now.Year}-{count + 1001}";

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
