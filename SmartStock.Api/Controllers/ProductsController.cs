using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Constants;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;
using SmartStock.Api.Services;

namespace SmartStock.Api.Controllers;

//[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    // GET: api/products (সব প্রোডাক্ট দেখার জন্য)
    [HttpGet]
    [Authorize(Policy = Permissions.Products.View)]
    public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
    {
        // সার্ভিসে আমরা IEnumerable<object> রিটার্ন করছি, তাই এখানে IActionResult ব্যবহার করা নিরাপদ
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }

    // POST: api/products (নতুন প্রোডাক্ট সেভ করার জন্য)
    [HttpPost]
    [Authorize(Policy = Permissions.Products.Create)] // সিস্টেম এটি অটোমেটিক হ্যান্ডেল করবে
    public async Task<ActionResult<Product>> PostProduct(Product product)
    {
        product.Id = Guid.NewGuid(); // আইডি এখানে জেনারেট হওয়া নিরাপদ
        product.CreatedAt = DateTime.UtcNow;
        // বিজনেস চেক: ফ্রন্টএন্ড থেকে আসা মডেল ভ্যালিড কিনা
        //if (!ModelState.IsValid) return BadRequest(ModelState);
        //var createdProduct = await _productService.CreateAsync(product);
        // ক্যাটাগরি আইডি চেক করুন
        var categoryExists = await _productService.CategoryExistsAsync(product.CategoryId);
        if (!categoryExists) return BadRequest("Invalid Category ID");

        var createdProduct = await _productService.CreateAsync(product);

        return Ok(createdProduct);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = Permissions.Products.Delete)] // কোনো নতুন পলিসি ডিক্লেয়ার করার দরকার নেই
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var deleted = await _productService.DeleteAsync(id);
        if (!deleted) return NotFound(new { message = "Product not found" });

        //return NoContent(); // সাকসেসফুল ডিলিট হলে আমরা সাধারণত NoContent পাঠাই
        return Ok(new { message = "Product deleted successfully" });
    }

    [HttpGet("{id}")]
    [Authorize(Policy = Permissions.Products.View)]
    public async Task<ActionResult<Product>> GetProduct(Guid id)
    {
        var product = await _productService.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = Permissions.Products.Edit)]
    public async Task<IActionResult> PutProduct(Guid id, Product product)
    {
        if (id != product.Id) return BadRequest("ID Mismatch");
        if (!ModelState.IsValid) return BadRequest(ModelState);
        await _productService.UpdateAsync(product);
        return Ok(new { message = "Product updated successfully" });
    }

    [HttpPost("bulk-upload")]
    [Authorize(Policy = Permissions.Products.Create)]
    public async Task<IActionResult> BulkUpload([FromBody] IEnumerable<Product> products)
    {
        if (products == null || !products.Any()) return BadRequest("No products provided");
        
        int processedCount = await _productService.BulkCreateAsync(products);
        return Ok(new { message = $"{processedCount} products uploaded successfully", count = processedCount });
    }

    [HttpGet("Ai/generate-description")] // ফ্রন্টঅ্যান্ডের পাথের সাথে হুবহু মিলিয়ে দেওয়া হলো 🚀
    [Authorize] // সিকিউরিটি গার্ড অন রাখা হলো
    public async Task<IActionResult> GetAiProductDescription([FromQuery] string productName, [FromServices] IGeminiService geminiService)
    {
        if (string.IsNullOrWhiteSpace(productName))
        {
            return BadRequest(new { message = "Product name cannot be empty." });
        }

        // আমাদের তৈরি করা GeminiService কল হবে (এখন এটি ডিকশনারি রিটার্ন করে)
        var aiResult = await geminiService.GenerateProductDataAsync(productName);

        // অ্যাঙ্গুলার যাতে অবজেক্ট আশা করছে: { description: '...', sku: '...' }
        return Ok(aiResult);
    }

}
