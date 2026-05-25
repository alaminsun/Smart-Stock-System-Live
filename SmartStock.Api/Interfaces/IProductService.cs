using SmartStock.Api.Models;

namespace SmartStock.Api.Services;

public interface IProductService
{
    //Task<IEnumerable<Product>> GetAllAsync();
    //Task<Product> CreateAsync(Product product);
    //Task<bool> DeleteAsync(Guid id);
    //Task<Product> GetByIdAsync(Guid id);
    //Task UpdateAsync(Product product);
    Task<IEnumerable<object>> GetAllAsync();
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product> CreateAsync(Product product);
    Task UpdateAsync(Product product);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> CategoryExistsAsync(int categoryId);
    Task<int> BulkCreateAsync(IEnumerable<Product> products);
}
