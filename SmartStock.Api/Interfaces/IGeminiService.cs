namespace SmartStock.Api.Interfaces
{
    public interface IGeminiService
    {
        // প্রোডাক্টের নাম দিলে এআই ডেসক্রিপশন এবং SKU জেনারেট করে দেবে
        Task<Dictionary<string, string>> GenerateProductDataAsync(string productName);
        Task<string> ListAvailableModelsAsync();
        Task<string> AnalyzeInventoryAsync(string inventoryJson);
        Task<string> ChatWithDataAsync(string userQuery, string contextJson);
    }
}
