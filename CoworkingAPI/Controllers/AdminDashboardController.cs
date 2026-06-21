using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDashboardController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetLocationFilter()
        {
            var role = int.TryParse(User.FindFirst(ClaimTypes.Role)?.Value, out var r) ? r : 0;
            if (role == 99) return null;
            var locStr = User.FindFirst("location_id")?.Value;
            return int.TryParse(locStr, out var l) && l > 0 ? l : null;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var now = DateTime.Today;
            var firstOfMonth = new DateTime(now.Year, now.Month, 1);
            var firstOfNextMonth = firstOfMonth.AddMonths(1);
            var locationId = GetLocationFilter();

            var query = _context.Bookings.AsQueryable();
            if (locationId.HasValue)
                query = query.Where(b => b.Rent!.Space!.location_id == locationId);

            var monthlyRevenue = await query
                .Where(b => b.status == 1 && b.start_date >= firstOfMonth && b.start_date < firstOfNextMonth)
                .SumAsync(b => b.total_price ?? 0);

            var activeContracts = await query
                .CountAsync(b => b.status == 1 && b.end_date > now);

            var todayBookings = await query
                .CountAsync(b => b.created_date >= now && b.created_date < now.AddDays(1));

            var expiringThisMonth = await query
                .CountAsync(b => b.status == 1 && b.end_date >= now && b.end_date < firstOfNextMonth);

            return Ok(new DashboardSummaryDto
            {
                MonthlyRevenue = monthlyRevenue,
                ActiveContracts = activeContracts,
                TodayBookings = todayBookings,
                ExpiringThisMonth = expiringThisMonth
            });
        }

        [HttpGet("expiring")]
        public async Task<IActionResult> GetExpiringContracts([FromQuery] int days = 7)
        {
            var now = DateTime.Today;
            var sevenDaysLater = now.AddDays(days);
            var locationId = GetLocationFilter();

            var query = _context.Bookings.AsQueryable();
            if (locationId.HasValue)
                query = query.Where(b => b.Rent!.Space!.location_id == locationId);

            var result = await query
                .Where(b => b.status == 1 && b.end_date >= now && b.end_date <= sevenDaysLater)
                .OrderBy(b => b.end_date)
                .Select(b => new ExpiringContractDto
                {
                    CustomerName = b.User!.name,
                    CustomerEmail = b.User.email,
                    SpaceNumber = b.Rent!.Space!.space_number,
                    EndDate = b.end_date,
                    DaysRemaining = (int)(b.end_date!.Value.Date - now).TotalDays,
                    Status = b.status
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPayments()
        {
            var locationId = GetLocationFilter();

            var query = _context.Bookings.AsQueryable();
            if (locationId.HasValue)
                query = query.Where(b => b.Rent!.Space!.location_id == locationId);

            var result = await query
                .Where(b => b.status == 0)
                .OrderBy(b => b.pay_deadline)
                .Select(b => new PendingPaymentDto
                {
                    CustomerName = b.User!.name,
                    CustomerEmail = b.User.email,
                    SpaceNumber = b.Rent!.Space!.space_number,
                    PayDeadline = b.pay_deadline,
                    TotalPrice = b.total_price
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}
