using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartStock.Api.Constants;
using SmartStock.Api.Data;
using SmartStock.Api.Models;
using SmartStock.Api.Interfaces;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SuppliersController : ControllerBase
    {
        private readonly IRepository<Supplier> _supplierRepository;

        public SuppliersController(IRepository<Supplier> supplierRepository)
        {
            _supplierRepository = supplierRepository;
        }

        [HttpGet]
        [Authorize(Policy = Permissions.Suppliers.View)]
        public async Task<ActionResult<IEnumerable<Supplier>>> GetSuppliers()
        {
            var suppliers = await _supplierRepository.FindAsync(s => s.IsActive);
            return Ok(suppliers);
        }

        [HttpPost]
        [Authorize(Policy = Permissions.Suppliers.Create)]
        public async Task<ActionResult<Supplier>> PostSupplier(Supplier supplier)
        {
            supplier.Id = Guid.NewGuid();
            var created = await _supplierRepository.AddAsync(supplier);
            await _supplierRepository.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSuppliers), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.Suppliers.Edit)]
        public async Task<IActionResult> PutSupplier(Guid id, Supplier supplier)
        {
            if (id != supplier.Id) return BadRequest();
            await _supplierRepository.UpdateAsync(supplier);
            await _supplierRepository.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Suppliers.Delete)]
        public async Task<IActionResult> DeleteSupplier(Guid id)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null) return NotFound();
            await _supplierRepository.DeleteAsync(supplier);
            await _supplierRepository.SaveChangesAsync();
            return NoContent();
        }
    }
}