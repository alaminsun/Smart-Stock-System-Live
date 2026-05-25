using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;

namespace SmartStock.Api.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IRepository<InventoryTransaction> _transactionRepository;
        private readonly IRepository<Product> _productRepository;
        private readonly IRepository<Customer> _customerRepository;
        private readonly IRepository<Invoice> _invoiceRepository;

        public InventoryService(
            IRepository<InventoryTransaction> transactionRepository,
            IRepository<Product> productRepository,
            IRepository<Customer> customerRepository,
            IRepository<Invoice> invoiceRepository)
        {
            _transactionRepository = transactionRepository;
            _productRepository = productRepository;
            _customerRepository = customerRepository;
            _invoiceRepository = invoiceRepository;
        }

        public async Task<bool> ProcessStockIn(InventoryTransaction transaction)
        {
            var product = await _productRepository.GetByIdAsync(transaction.ProductId);
            if (product == null) return false;

            product.Quantity += transaction.Quantity;
            await _productRepository.UpdateAsync(product);

            transaction.Id = Guid.NewGuid();
            transaction.TransactionType = "StockIn";
            transaction.TransactionDate = DateTime.UtcNow;
            transaction.CustomerId = null;

            await _transactionRepository.AddAsync(transaction);
            await _transactionRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ProcessStockOut(InventoryTransaction transaction)
        {
            var product = await _productRepository.GetByIdAsync(transaction.ProductId);
            if (product == null || product.Quantity < transaction.Quantity) return false;

            product.Quantity -= transaction.Quantity;
            await _productRepository.UpdateAsync(product);

            transaction.Id = Guid.NewGuid();
            transaction.TransactionType = "StockOut";
            transaction.TransactionDate = DateTime.UtcNow;
            transaction.SupplierId = null;

            await _transactionRepository.AddAsync(transaction);
            await _transactionRepository.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<object>> GetTransactionHistoryAsync()
        {
            return await _transactionRepository.Query()
                .Include(t => t.Product)
                .Include(t => t.Supplier)
                .Include(t => t.Customer)
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => new {
                    t.Id,
                    t.TransactionDate,
                    t.TransactionType,
                    t.Quantity,
                    ProductName = t.Product != null ? t.Product.Name : "N/A",
                    SupplierName = t.Supplier != null ? t.Supplier.Name : "N/A",
                    CustomerName = t.Customer != null ? t.Customer.Name : "N/A",
                    t.Remarks
                })
                .ToListAsync();
        }

        public async Task<object> GetDashboardSummaryAsync()
        {
            var totalProducts = await _productRepository.CountAsync();
            var totalStock = await _productRepository.Query().SumAsync(p => (int?)p.Quantity) ?? 0;
            var totalCustomers = await _customerRepository.CountAsync();

            var today = DateTime.UtcNow.Date;
            var todayIn = await _transactionRepository.Query()
                .Where(t => t.TransactionType == "StockIn" && t.TransactionDate >= today)
                .SumAsync(t => (int?)t.Quantity) ?? 0;

            var todayOut = await _transactionRepository.Query()
                .Where(t => t.TransactionType == "StockOut" && t.TransactionDate >= today)
                .SumAsync(t => (int?)t.Quantity) ?? 0;

            var totalInvoices = await _invoiceRepository.CountAsync();
            var totalRevenue = await _invoiceRepository.Query().SumAsync(i => (decimal?)i.NetAmount) ?? 0;
            var todayRevenue = await _invoiceRepository.Query()
                .Where(i => i.InvoiceDate >= today)
                .SumAsync(i => (decimal?)i.NetAmount) ?? 0;

            return new
            {
                TotalProducts = totalProducts,
                TotalStockQuantity = totalStock,
                TotalCustomers = totalCustomers,
                TodayIn = todayIn,
                TodayOut = todayOut,
                TotalInvoices = totalInvoices,
                TotalRevenue = totalRevenue,
                TodayRevenue = todayRevenue
            };
        }

        public async Task<object> GetWeeklyChartDataAsync()
        {
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.UtcNow.Date.AddDays(-i))
                .Reverse()
                .ToList();

            var chartData = await _transactionRepository.Query()
                .Where(t => t.TransactionDate >= last7Days.First())
                .GroupBy(t => new { t.TransactionDate.Date, t.TransactionType })
                .Select(g => new {
                    Date = g.Key.Date,
                    Type = g.Key.TransactionType,
                    Count = g.Sum(x => x.Quantity)
                })
                .ToListAsync();

            return last7Days.Select(date => new {
                Date = date.ToString("dd MMM"),
                In = chartData.Where(d => d.Date == date && d.Type == "StockIn").Sum(d => d.Count),
                Out = chartData.Where(d => d.Date == date && d.Type == "StockOut").Sum(d => d.Count)
            });
        }

        public async Task<IEnumerable<object>> GetLowStockProductsAsync()
        {
            return await _productRepository.Query()
                .Where(p => p.Quantity <= p.MinStockLevel)
                .Select(p => new { p.Id, p.Name, p.Quantity, p.SKU, p.MinStockLevel })
                .ToListAsync();
        }

        public async Task<IEnumerable<object>> GetHistoryByDateAsync(DateTime fromDate, DateTime toDate)
        {
            return await _transactionRepository.Query()
                .Include(t => t.Product)
                .Where(t => t.TransactionDate >= fromDate && t.TransactionDate <= toDate)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }
    }
}
