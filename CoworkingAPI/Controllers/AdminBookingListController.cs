using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using CoworkingAPI.Models;
using CoworkingAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminBookingListController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILineService _lineService;

        public AdminBookingListController(AppDbContext context, ILineService lineService)
        {
            _context = context;
            _lineService = lineService;
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] int status)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound($"找不到預約 #{id}");
            booking.status = status;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("calendar")]
        public async Task<IActionResult> calendar()
        {
            var booking = await _context.Bookings.Select(b => new AdminBookingListDto
            {
                contract_id = b.contract_id,
                username = b.User != null ? b.User.name : null,
                spacename = b.Rent != null && b.Rent.Space != null ? b.Rent.Space.space_number : null,
                start_date = b.start_date ?? DateTime.MinValue,
                status = b.status ?? 0
            }).ToListAsync();

            return Ok(booking);
        }

        [HttpPost("add")]
        public async Task<IActionResult> Add([FromBody] CreateBookingDto dto)
        {
            try
            {
                if (dto.rent_id == null || dto.start_date == null || dto.end_date == null)
                    return BadRequest("rent_id、start_date、end_date 為必填");

                var rent = await _context.Rents.FindAsync(dto.rent_id);
                if (rent == null)
                    return BadRequest($"找不到租賃方案 #{dto.rent_id}");

                var start = dto.start_date.Value;
                var end = dto.end_date.Value;

                decimal totalPrice = 0;
                var price = rent.price ?? 0;

                switch (rent.price_type)
                {
                    case 1:
                        var hours = (decimal)Math.Ceiling((end - start).TotalHours);
                        totalPrice = hours * price;
                        break;
                    case 2:
                        var days = (decimal)Math.Ceiling((end - start).TotalDays);
                        totalPrice = days * price;
                        break;
                    case 3:
                        var months = ((end.Year - start.Year) * 12) + end.Month - start.Month;
                        totalPrice = months * price;
                        break;
                    default:
                        return BadRequest($"未知的 price_type: {rent.price_type}");
                }

                var booking = new Booking
                {
                    user_id = dto.user_id,
                    rent_id = dto.rent_id,
                    employees_id = dto.employees_id,
                    start_date = start,
                    end_date = end,
                    company_name = dto.company_name,
                    tax_id = dto.tax_id,
                    status = dto.status,
                    total_price = totalPrice,
                    created_date = DateTime.Now,
                };
                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                // 發 LINE 推播通知
                if (dto.user_id.HasValue)
                {
                    var user = await _context.Users.FindAsync(dto.user_id.Value);
                    if (user?.line_id != null)
                    {
                        var spaceRent = await _context.Rents
                            .Include(r => r.Space)
                            .FirstOrDefaultAsync(r => r.rent_id == dto.rent_id);
                        var spaceName = spaceRent?.Space?.space_number ?? "共享空間";
                        var date = start.ToString("yyyy/MM/dd");
                        var timeRange = $"{start:HH:mm} - {end:HH:mm}";
                        var confirmCode = $"CW-{booking.contract_id:D4}";
                        try
                        {
                            await _lineService.SendBookingConfirmationAsync(user.line_id, spaceName, date, timeRange, confirmCode);
                        }
                        catch { }
                    }
                }

                return Ok(new { contract_id = booking.contract_id, total_price = booking.total_price });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
            }
        }

        [HttpGet("details")]
        public async Task<IActionResult> details([FromQuery ]DateTime date)
        {
            var details = await _context.Bookings.Where(b => b.start_date.HasValue && b.start_date.Value.Date == date.Date).Select(b => new AdminBookingDetailDto
            {
                contract_id = b.contract_id,
                username = b.User != null ? b.User.name : null,
                email = b.User != null ? b.User.email : null,
                companyname = b.company_name,
                tax_id = b.tax_id,
                price_type = b.Rent != null ? b.Rent.price_type : null,
                start_date = b.start_date,
                end_date = b.end_date,
                total_price = b.total_price,
                status = b.status
            }).ToListAsync();
            return Ok(details);
        }
    }
}
