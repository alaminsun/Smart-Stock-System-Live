using SmartStock.Api.Models;

namespace SmartStock.Api.Interfaces
{
    public interface IInventoryService
    {
        Task<bool> ProcessStockIn(InventoryTransaction transaction);
        Task<bool> ProcessStockOut(InventoryTransaction transaction);
        Task<IEnumerable<object>> GetTransactionHistoryAsync();
        Task<object> GetDashboardSummaryAsync();
        Task<object> GetWeeklyChartDataAsync();
        Task<IEnumerable<object>> GetLowStockProductsAsync();
        Task<IEnumerable<object>> GetHistoryByDateAsync(DateTime fromDate, DateTime toDate);
    }
}
