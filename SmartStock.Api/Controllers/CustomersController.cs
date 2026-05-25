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
    public class CustomersController : ControllerBase
    {
        private readonly IRepository<Customer> _customerRepository;

        public CustomersController(IRepository<Customer> customerRepository)
        {
            _customerRepository = customerRepository;
        }

        [HttpGet]
        [Authorize(Policy = Permissions.Customers.View)]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            var customers = await _customerRepository.GetAllAsync();
            return Ok(customers);
        }

        [HttpPost]
        [Authorize(Policy = Permissions.Customers.Create)]
        public async Task<ActionResult<Customer>> PostCustomer(Customer customer)
        {
            customer.Id = Guid.NewGuid();
            var created = await _customerRepository.AddAsync(customer);
            await _customerRepository.SaveChangesAsync();
            return Ok(created);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.Customers.Edit)]
        public async Task<IActionResult> PutCustomer(Guid id, Customer customer)
        {
            if (id != customer.Id) return BadRequest();
            await _customerRepository.UpdateAsync(customer);
            await _customerRepository.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Customers.Delete)]
        public async Task<IActionResult> DeleteCustomer(Guid id)
        {
            var customer = await _customerRepository.GetByIdAsync(id);
            if (customer == null) return NotFound();
            await _customerRepository.DeleteAsync(customer);
            await _customerRepository.SaveChangesAsync();
            return NoContent();
        }
    }
}
