using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Constants;
using SmartStock.Api.Data;
using SmartStock.Api.Models;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.GlobalSettings.ToListAsync();

            // ইফ টেবিল ইজ এম্পটি, এড ডিফল্ট সেটিংস
            if (!settings.Any())
            {
                var defaultSettings = new List<GlobalSetting>
                {
                    new GlobalSetting { Key = "CompanyName", Value = "SmartStock System", Group = "Company", Description = "Name of your business" },
                    new GlobalSetting { Key = "CompanyAddress", Value = "Dhaka, Bangladesh", Group = "Company", Description = "Business address" },
                    new GlobalSetting { Key = "CompanyPhone", Value = "+880123456789", Group = "Company", Description = "Contact number" },
                    new GlobalSetting { Key = "CurrencySymbol", Value = "৳", Group = "Finance", Description = "Currency symbol used in reports and invoices" },
                    new GlobalSetting { Key = "VatPercentage", Value = "5", Group = "Finance", Description = "Default VAT percentage" },
                    new GlobalSetting { Key = "InvoicePrefix", Value = "INV", Group = "Invoice", Description = "Prefix for invoice numbers" },
                    new GlobalSetting { Key = "PrimaryColor", Value = "#4f46e5", Group = "Appearance", Description = "Primary theme color of the application" }
                };
                _context.GlobalSettings.AddRange(defaultSettings);
                await _context.SaveChangesAsync();
                settings = defaultSettings;
            }

            return Ok(settings);
        }

        [HttpPost("update-bulk")]
        [Authorize(Policy = Permissions.Users.Edit)] // Assuming only admins can change settings
        public async Task<IActionResult> UpdateSettings([FromBody] List<GlobalSetting> settings)
        {
            foreach (var setting in settings)
            {
                var existing = await _context.GlobalSettings.FindAsync(setting.Key);
                if (existing != null)
                {
                    existing.Value = setting.Value;
                }
                else
                {
                    _context.GlobalSettings.Add(setting);
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Settings updated successfully" });
        }

        [HttpGet("public")]
        [AllowAnonymous] // Some settings like Company Name and Currency might be needed before login
        public async Task<IActionResult> GetPublicSettings()
        {
            var publicKeys = new[] { "CompanyName", "CurrencySymbol", "PrimaryColor" };
            var settings = await _context.GlobalSettings
                .Where(s => publicKeys.Contains(s.Key))
                .ToDictionaryAsync(s => s.Key, s => s.Value);
            return Ok(settings);
        }
    }
}
