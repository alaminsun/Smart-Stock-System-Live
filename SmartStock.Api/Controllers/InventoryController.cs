using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartStock.Api.Constants;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;
using SmartStock.Api.Services;
using System.Security.Claims;

namespace SmartStock.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    // ১. POST: api/inventory/stock-in
    [HttpPost("stock-in")]
    [Authorize(Policy = Permissions.Inventory.Manage)]
    public async Task<IActionResult> StockIn([FromBody] InventoryTransaction transaction)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // বর্তমান ইউজারের আইডি সেট করা (অডিট ট্রেইল)
        transaction.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var result = await _inventoryService.ProcessStockIn(transaction);

        if (result)
            return Ok(new { message = "Stock increased successfully!" });

        return BadRequest("Could not process stock-in. Check Product ID.");
    }

    // ২. POST: api/inventory/stock-out
    [HttpPost("stock-out")]
    [Authorize(Policy = Permissions.Inventory.Manage)]
    public async Task<IActionResult> StockOut([FromBody] InventoryTransaction transaction)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        transaction.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var result = await _inventoryService.ProcessStockOut(transaction);

        if (result)
            return Ok(new { message = "Stock decreased successfully!" });

        // স্টক আউট ফেল করার মানে হতে পারে ইনভ্যালিড প্রোডাক্ট অথবা পর্যাপ্ত স্টক নেই
        return BadRequest("Insufficient stock or invalid product.");
    }

    [HttpGet("history")]
    [Authorize(Policy = Permissions.Inventory.View)]
    public async Task<ActionResult> GetTransactionHistory()
    {
        var history = await _inventoryService.GetTransactionHistoryAsync();
        return Ok(history);
    }

    [HttpGet("summary")]
    [Authorize(Policy = Permissions.Inventory.View)]
    public async Task<ActionResult> GetSummary()
    {
        return Ok(await _inventoryService.GetDashboardSummaryAsync());
    }


    [HttpGet("weekly-chart")]
    [Authorize(Policy = Permissions.Inventory.View)]
    public async Task<ActionResult> GetWeeklyChart()
    {
        var data = await _inventoryService.GetWeeklyChartDataAsync();
        return Ok(data);
    }

    // GET: api/inventory/low-stock
    [HttpGet("low-stock")]
    [Authorize(Policy = Permissions.Inventory.View)]
    public async Task<ActionResult> GetLowStock()
    {
        var products = await _inventoryService.GetLowStockProductsAsync();
        return Ok(products);
    }

    // GET: api/inventory/history/filter?from=...&to=...
    [HttpGet("history/filter")]
    [Authorize(Policy = Permissions.Inventory.View)]
    public async Task<ActionResult> GetHistoryByDate([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        // তারিখের সময় ঠিক করা (দিনের শুরু থেকে শেষ পর্যন্ত)
        var result = await _inventoryService.GetHistoryByDateAsync(from.Date, to.Date.AddDays(1).AddTicks(-1));
        return Ok(result);
    }

}