using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Constants;
using SmartStock.Api.Data;
using SmartStock.Api.Models;
using SmartStock.Api.Interfaces;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly IRepository<Category> _categoryRepository;

        public CategoriesController(IRepository<Category> categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        // ১. সব ক্যাটাগরি গেট করা (পারমিশন ভিত্তিক)
        [HttpGet]
        [Authorize(Policy = Permissions.Categories.View)]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            var categories = await _categoryRepository.GetAllAsync();
            return Ok(categories.OrderBy(c => c.Name));
        }

        // ২. নতুন ক্যাটাগরি তৈরি (বিজনেস লজিক: ক্যাটাগরি ডুপ্লিকেট হওয়া যাবে না)
        [HttpPost]
        [Authorize(Policy = Permissions.Categories.Create)]
        public async Task<ActionResult<Category>> PostCategory(Category category)
        {
            var exists = await _categoryRepository.ExistsAsync(c => c.Name == category.Name);
            if (exists) return BadRequest("Category already exists");

            var created = await _categoryRepository.AddAsync(category);
            await _categoryRepository.SaveChangesAsync();
            return Ok(created);
        }

        // ৩. ক্যাটাগরি আপডেট করা
        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.Categories.Edit)]
        public async Task<IActionResult> PutCategory(int id, Category category)
        {
            if (id != category.Id) return BadRequest("Category ID mismatch");

            var existingCategory = await _categoryRepository.GetByIdAsync(id);
            if (existingCategory == null) return NotFound("Category not found");

            existingCategory.Name = category.Name;
            existingCategory.Description = category.Description;

            await _categoryRepository.UpdateAsync(existingCategory);
            await _categoryRepository.SaveChangesAsync();
            return Ok(existingCategory);
        }

        // ৪. ডিলিট লজিক (নিরাপত্তা: ক্যাটাগরিতে প্রোডাক্ট থাকলে ডিলিট করা যাবে না)
        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Categories.Delete)]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null) return NotFound();

            await _categoryRepository.DeleteAsync(category);
            await _categoryRepository.SaveChangesAsync();
            return Ok();
        }
    }
}
