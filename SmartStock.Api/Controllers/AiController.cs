using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Interfaces;
using System.Threading.Tasks;
using SmartStock.Api.Constants;

namespace SmartStock.Api.Controllers
{
    [Authorize(Policy = Permissions.Ai.Chat)] // শুধুমাত্র পারমিশন থাকলে এআই কল করা যাবে 🛡️
    [Route("api/[controller]")]
    [ApiController]
    public class AiController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public AiController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [Authorize(Policy = Permissions.Products.Edit)]
        [HttpGet("generate-description")]
        public async Task<IActionResult> GetProductDescription([FromQuery] string productName)
        {
            if (string.IsNullOrWhiteSpace(productName))
            {
                return BadRequest(new { message = "Product name cannot be empty." });
            }

            var aiResult = await _geminiService.GenerateProductDataAsync(productName);
            return Ok(aiResult);
        }

        [HttpGet("debug-models")] // ডায়াগনোসিসের জন্য নতুন এন্ডপয়েন্ট
        public async Task<IActionResult> GetAvailableModels()
        {
            var result = await _geminiService.ListAvailableModelsAsync();
            return Ok(result);
        }

        [HttpGet("analyze-inventory")]
        public async Task<IActionResult> AnalyzeInventory([FromServices] SmartStock.Api.Data.AppDbContext context)
        {
            // ডাটাবেস থেকে প্রয়োজনীয় সামারি ডেটা নেওয়া
            var products = await context.Products
                .Select(p => new { p.Name, p.Quantity, p.MinStockLevel, p.SalePrice })
                .ToListAsync();

            var salesSummary = await context.InvoiceItems
                .GroupBy(i => i.Product!.Name)
                .Select(g => new { ProductName = g.Key, TotalSold = g.Sum(x => x.Quantity) })
                .ToListAsync();

            var contextData = new { Stock = products, Sales = salesSummary };
            var jsonContext = System.Text.Json.JsonSerializer.Serialize(contextData);

            var report = await _geminiService.AnalyzeInventoryAsync(jsonContext);
            return Ok(new { report });
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request, [FromServices] SmartStock.Api.Data.AppDbContext context)
        {
            // ১. কারেন্ট স্টক স্ট্যাটাস (টপ ২০)
            var stockStats = await context.Products
                .Select(p => new { p.Name, p.Quantity, p.SalePrice })
                .Take(20)
                .ToListAsync();

            // ২. গত ৩০ দিনের বিক্রির সামারি
            var lastMonthDate = DateTime.UtcNow.AddDays(-30);
            var lastMonthSales = await context.Invoices
                .Where(i => i.InvoiceDate >= lastMonthDate)
                .SumAsync(i => i.NetAmount);

            var topSellingProducts = await context.InvoiceItems
                .Where(ii => ii.Invoice!.InvoiceDate >= lastMonthDate)
                .GroupBy(ii => ii.Product!.Name)
                .Select(g => new { ProductName = g.Key, TotalSold = g.Sum(x => x.Quantity), Revenue = g.Sum(x => x.SubTotal) })
                .OrderByDescending(x => x.TotalSold)
                .Take(5)
                .ToListAsync();

            var contextData = new 
            { 
                CurrentStock = stockStats, 
                Last30DaysSummary = new {
                    TotalRevenue = lastMonthSales,
                    TopSelling = topSellingProducts,
                    Period = "Last 30 Days"
                }
            };

            var contextJson = System.Text.Json.JsonSerializer.Serialize(contextData);

            var answer = await _geminiService.ChatWithDataAsync(request.Message, contextJson);
            return Ok(new { answer });
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}