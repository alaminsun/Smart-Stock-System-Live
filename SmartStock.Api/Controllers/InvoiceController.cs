using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartStock.Api.Constants;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;

namespace SmartStock.Api.Controllers
{
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;

        public InvoiceController(IInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        // POST: api/invoice
        [HttpPost]
        [Authorize(Policy = Permissions.Invoices.Create)]
        public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
        {
            try
            {
                var userName = User.Identity?.Name;
                if (string.IsNullOrEmpty(userName))
                {
                    userName = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                               ?? "System Admin";
                }
                invoice.CreatedBy = userName;
                var result = await _invoiceService.CreateInvoiceAsync(invoice);
                return CreatedAtAction(nameof(GetInvoiceById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET: api/invoice
        [HttpGet]
        [Authorize(Policy = Permissions.Invoices.View)]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetAllInvoices()
        {
            return Ok(await _invoiceService.GetAllInvoicesAsync());
        }

        // GET: api/invoice/{id}
        [HttpGet("{id}")]
        [Authorize(Policy = Permissions.Invoices.View)]
        public async Task<ActionResult<Invoice>> GetInvoiceById(Guid id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }
        // DELETE: api/invoice/{id}
        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Invoices.Delete)]
        public async Task<IActionResult> DeleteInvoice(Guid id)
        {
            var result = await _invoiceService.DeleteInvoiceAsync(id);
            if (!result) return NotFound(new { message = "Invoice not found" });

            return Ok(new { message = "Invoice deleted and stock reverted successfully" });
        }
    }
}
