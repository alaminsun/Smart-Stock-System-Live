using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Constants;
using SmartStock.Api.Interfaces;

namespace SmartStock.Api.Controllers
{
    
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        // Dependency Injection এর মাধ্যমে ইন্টারফেস ইনজেক্ট করা
        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [Authorize(Policy = Permissions.Reports.View)]
        [HttpGet("profit-loss-statement")]
        public async Task<IActionResult> GetProfitLossStatement([FromQuery] string period = "month")
        {
            try
            {
                var result = await _reportService.GetProfitLossStatementAsync(period);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // ট্রাই-ক্যাচ ব্লক রাখা ভালো যাতে কোনো এরর হলে সার্ভার ক্র্যাশ না করে ক্লিন মেসেজ দেয়
                return StatusCode(500, new { message = "An error occurred while generating the report.", error = ex.Message });
            }
        }
    }
}
