namespace CoworkingAPI.Dto
{
    public class DashboardSummaryDto
    {
        public decimal MonthlyRevenue { get; set; }
        public int ActiveContracts { get; set; }
        public int TodayBookings { get; set; }
        public int ExpiringThisMonth { get; set; }
    }

    public class ExpiringContractDto
    {
        public string? CustomerName { get; set; }
        public string? CustomerEmail { get; set; }
        public string? SpaceNumber { get; set; }
        public DateTime? EndDate { get; set; }
        public int DaysRemaining { get; set; }
        public int? Status { get; set; }
    }

    public class PendingPaymentDto
    {
        public string? CustomerName { get; set; }
        public string? CustomerEmail { get; set; }
        public string? SpaceNumber { get; set; }
        public DateTime? PayDeadline { get; set; }
        public decimal? TotalPrice { get; set; }
    }
}
