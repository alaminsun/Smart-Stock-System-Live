using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Constants;
using SmartStock.Api.Data;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = Permissions.Dashboard.View)]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats([FromQuery] string period = "today")
        {
            try
            {
                DateTime startDate;
                DateTime previousStartDate;
                DateTime previousEndDate;
                DateTime endDate = DateTime.Now;

                switch (period.ToLower())
                {
                    case "week":
                        startDate = DateTime.Today.AddDays(-7);
                        previousStartDate = startDate.AddDays(-7);
                        previousEndDate = startDate;
                        break;
                    case "month":
                        startDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                        previousStartDate = startDate.AddMonths(-1);
                        previousEndDate = startDate;
                        break;
                    case "year":
                        startDate = new DateTime(DateTime.Today.Year, 1, 1);
                        previousStartDate = startDate.AddYears(-1);
                        previousEndDate = startDate;
                        break;
                    case "today":
                    default:
                        startDate = DateTime.Today;
                        previousStartDate = startDate.AddDays(-1);
                        previousEndDate = startDate;
                        break;
                }

                // Current Period Sales
                var currentPeriodSales = await _context.Invoices
                    .Where(i => i.InvoiceDate >= startDate && i.InvoiceDate <= endDate)
                    .SumAsync(i => (decimal?)i.NetAmount) ?? 0;

                // Previous Period Sales for Growth Comparison
                var previousPeriodSales = await _context.Invoices
                    .Where(i => i.InvoiceDate >= previousStartDate && i.InvoiceDate < previousEndDate)
                    .SumAsync(i => (decimal?)i.NetAmount) ?? 0;

                // Recent Transactions
                var recentTransactions = await _context.Invoices
                    .Include(i => i.Customer)
                    .Where(i => i.InvoiceDate >= startDate && i.InvoiceDate <= endDate)
                    .OrderByDescending(i => i.InvoiceDate)
                    .Take(10)
                    .Select(i => new {
                        i.Id,
                        i.InvoiceNo,
                        CustomerName = i.Customer != null ? i.Customer.Name : "Walk-in",
                        i.NetAmount,
                        i.InvoiceDate,
                        i.CreatedBy
                    })
                    .ToListAsync();

                // Top Selling Products (Filtered to avoid null Products)
                var topProducts = await _context.InvoiceItems
                    .Include(ii => ii.Product)
                    .Where(ii => ii.Invoice.InvoiceDate >= startDate && ii.Invoice.InvoiceDate <= endDate && ii.Product != null)
                    .GroupBy(ii => ii.Product!.Name)
                    .Select(g => new {
                        ProductName = g.Key,
                        TotalSold = g.Sum(ii => ii.Quantity)
                    })
                    .OrderByDescending(x => x.TotalSold)
                    .Take(5)
                    .ToListAsync();

                // User Performance
                var userPerformance = await _context.Invoices
                    .Where(i => i.InvoiceDate >= startDate && i.InvoiceDate <= endDate)
                    .GroupBy(i => i.CreatedBy)
                    .Select(g => new
                    {
                        UserName = g.Key ?? "Unknown",
                        TotalSales = g.Sum(x => x.NetAmount),
                        InvoiceCount = g.Count()
                    })
                    .OrderByDescending(x => x.TotalSales)
                    .ToListAsync();

                decimal salesGrowth = 0;
                if (previousPeriodSales > 0)
                {
                    salesGrowth = ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100;
                }
                else if (currentPeriodSales > 0)
                {
                    salesGrowth = 100;
                }

                // Total Revenue and Profit calculations
                var report = await _context.InvoiceItems
                    .Include(ii => ii.Product)
                    .Where(ii => ii.Invoice.InvoiceDate >= startDate)
                    .Select(ii => new {
                        Revenue = ii.Quantity * ii.UnitPrice,
                        Cost = ii.Quantity * (ii.Product != null ? ii.Product.CostPrice : 0),
                        Profit = (ii.Quantity * ii.UnitPrice) - (ii.Quantity * (ii.Product != null ? ii.Product.CostPrice : 0))
                    })
                    .ToListAsync();

                var totalRevenue = report.Sum(r => r.Revenue);
                var totalCost = report.Sum(r => r.Cost);
                var netProfit = report.Sum(r => r.Profit);

                return Ok(new
                {
                    TodaySales = currentPeriodSales,
                    YesterdaySales = previousPeriodSales,
                    RecentTransactions = recentTransactions,
                    TopProducts = topProducts,
                    SalesGrowth = Math.Round(salesGrowth, 2),
                    UserPerformance = userPerformance,
                    TotalRevenue = totalRevenue,
                    TotalCost = totalCost,
                    NetProfit = netProfit,
                    ProfitMargin = totalRevenue > 0 ? Math.Round((netProfit / totalRevenue) * 100, 2) : 0
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        //[HttpGet("profit-stats")]
        //public async Task<IActionResult> GetProfitStats([FromQuery] string period = "month")
        //{
        //    var startDate = GetStartDate(period); // ?????? ??????? ??? ??? ???? ?????

        //    var report = await _context.InvoiceItems
        //        .Where(ii => ii.Invoice.InvoiceDate >= startDate)
        //        .Select(ii => new {
        //            Revenue = ii.Quantity * ii.UnitPrice,
        //            Cost = ii.Quantity * ii.Product.CostPrice,
        //            Profit = (ii.Quantity * ii.UnitPrice) - (ii.Quantity * ii.Product.CostPrice)
        //        })
        //        .ToListAsync();

        //    var totalRevenue = report.Sum(r => r.Revenue);
        //    var totalCost = report.Sum(r => r.Cost);
        //    var netProfit = report.Sum(r => r.Profit);

        //    return Ok(new
        //    {
        //        totalRevenue,
        //        totalCost,
        //        netProfit,
        //        profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        //    });
        //}
    }
}
