using SmartStock.Api.Models;

namespace SmartStock.Api.Interfaces
{
    public interface IInvoiceService
    {
        Task<Invoice> CreateInvoiceAsync(Invoice invoice);
        Task<IEnumerable<Invoice>> GetAllInvoicesAsync();
        Task<Invoice?> GetInvoiceByIdAsync(Guid id);
        Task<bool> DeleteInvoiceAsync(Guid id);
    }
}
