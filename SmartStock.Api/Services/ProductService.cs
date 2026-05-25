using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;

namespace SmartStock.Api.Services;

public class ProductService : IProductService
{
    private readonly IRepository<Product> _productRepository;
    private readonly IRepository<Category> _categoryRepository;

    public ProductService(IRepository<Product> productRepository, IRepository<Category> categoryRepository)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<IEnumerable<object>> GetAllAsync()
    {
        // Use Query() to enable Eager Loading (Include)
        return await _productRepository.Query()
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new {
                p.Id,
                p.Name,
                p.SKU,
                p.CostPrice,
                p.SalePrice,
                p.Quantity,
                p.MinStockLevel,
                p.Description,
                p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : "No Category",
                p.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<Product> CreateAsync(Product product)
    {
        product.CreatedAt = DateTime.UtcNow;
        var created = await _productRepository.AddAsync(product);
        await _productRepository.SaveChangesAsync();
        return created;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null) return false;

        await _productRepository.DeleteAsync(product);
        await _productRepository.SaveChangesAsync();
        return true;
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _productRepository.GetByIdAsync(id);
    }

    public async Task UpdateAsync(Product product)
    {
        var existingProduct = await _productRepository.GetByIdAsync(product.Id);
        if (existingProduct != null)
        {
            existingProduct.Name = product.Name;
            existingProduct.SKU = product.SKU;
            existingProduct.CostPrice = product.CostPrice;
            existingProduct.SalePrice = product.SalePrice;
            existingProduct.Quantity = product.Quantity;
            existingProduct.MinStockLevel = product.MinStockLevel;
            existingProduct.Description = product.Description;
            existingProduct.CategoryId = product.CategoryId;

            await _productRepository.UpdateAsync(existingProduct);
            await _productRepository.SaveChangesAsync();
        }
    }

    public async Task<bool> CategoryExistsAsync(int categoryId)
    {
        return await _categoryRepository.ExistsAsync(c => c.Id == categoryId);
    }

    public async Task<int> BulkCreateAsync(IEnumerable<Product> products)
    {
        int count = 0;
        foreach (var product in products)
        {
            // Skip if SKU already exists
            var exists = await _productRepository.ExistsAsync(p => p.SKU == product.SKU);
            if (exists) continue;

            product.Id = Guid.NewGuid();
            product.CreatedAt = DateTime.UtcNow;
            await _productRepository.AddAsync(product);
            count++;
        }
        
        if (count > 0)
        {
            await _productRepository.SaveChangesAsync();
        }
        return count;
    }
}