namespace SmartStock.Api.Interfaces
{
    public interface IReportService
    {
        Task<object> GetProfitLossStatementAsync(string period);
    }
}
