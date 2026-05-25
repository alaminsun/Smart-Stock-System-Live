using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;

namespace SmartStock.Api.Services
{
    public class ReportService : IReportService
    {
        private readonly IRepository<InvoiceItem> _invoiceItemRepository;

        public ReportService(IRepository<InvoiceItem> invoiceItemRepository)
        {
            _invoiceItemRepository = invoiceItemRepository;
        }

        public async Task<object> GetProfitLossStatementAsync(string period)
        {
            DateTime startDate = DateTime.Today.AddMonths(-1);
            if (period == "today") startDate = DateTime.Today;
            else if (period == "week") startDate = DateTime.Today.AddDays(-7);
            else if (period == "year") startDate = new DateTime(DateTime.Today.Year, 1, 1);

            var items = await _invoiceItemRepository.Query()
                .Where(ii => ii.Invoice.InvoiceDate >= startDate)
                .Select(ii => new
                {
                    ProductName = ii.Product.Name,
                    ii.Quantity,
                    Revenue = ii.Quantity * ii.UnitPrice,
                    Cost = ii.Quantity * ii.Product.CostPrice,
                    Profit = (ii.Quantity * ii.UnitPrice) - (ii.Quantity * ii.Product.CostPrice)
                })
                .ToListAsync();

            var totalSales = items.Sum(x => x.Revenue);
            var totalCostOfGoodsSold = items.Sum(x => x.Cost);
            var netProfit = items.Sum(x => x.Profit);
            var profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

            var productBreakdown = items.GroupBy(x => x.ProductName)
                .Select(g => new
                {
                    ProductName = g.Key,
                    QuantitySold = g.Sum(x => x.Quantity),
                    TotalRevenue = g.Sum(x => x.Revenue),
                    TotalCost = g.Sum(x => x.Cost),
                    NetProfit = g.Sum(x => x.Profit),
                    Margin = g.Sum(x => x.Revenue) > 0 ? (g.Sum(x => x.Profit) / g.Sum(x => x.Revenue)) * 100 : 0
                })
                .OrderByDescending(x => x.NetProfit)
                .ToList();

            return new
            {
                TotalSales = totalSales,
                CostOfGoodsSold = totalCostOfGoodsSold,
                NetProfit = netProfit,
                ProfitMargin = Math.Round(profitMargin, 2),
                Products = productBreakdown
            };
        }
    }
}
