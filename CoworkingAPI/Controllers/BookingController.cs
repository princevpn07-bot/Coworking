using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using CoworkingAPI.Dto;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var booking = await _context.Bookings.ToListAsync();
            return Ok(booking);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.contract_id == id);
            if (booking == null) return NotFound($"沒有{id}");
            return Ok(booking);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] Booking Booking)
        {
            _context.Bookings.Add(Booking);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), Booking);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] Booking Booking)
        {
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.contract_id == Booking.contract_id);
            if (booking == null) return NotFound($"沒有{Booking.contract_id}");
            booking.user_id = Booking.user_id;
            booking.rent_id = Booking.rent_id;
            booking.employees_id = Booking.employees_id;
            booking.created_date = Booking.created_date;
            booking.start_date = Booking.start_date;
            booking.end_date = Booking.end_date;
            booking.company_name = Booking.company_name;
            booking.tax_id = Booking.tax_id;
            booking.status = Booking.status;
            booking.pay_deadline = Booking.pay_deadline;
            booking.cancelled_daedline = Booking.cancelled_daedline;
            booking.total_price = Booking.total_price;

            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("GetByUser/{user_id}")]
        public async Task<IActionResult> GetByUser(int user_id)
        {
            var orders = await _context.Bookings
                .Where(b => b.user_id == user_id)
                .Select(b => new FrontendMyOrderDto
                {
                    contract_id = b.contract_id,
                    space_name = b.Rent != null && b.Rent.Space != null ? b.Rent.Space.space_number : null,
                    location_city = b.Rent != null && b.Rent.Space != null && b.Rent.Space.Location != null ? b.Rent.Space.Location.city : null,
                    location_address = b.Rent != null && b.Rent.Space != null && b.Rent.Space.Location != null ? b.Rent.Space.Location.address : null,
                    price_type = b.Rent != null ? b.Rent.price_type : null,
                    price = b.Rent != null ? b.Rent.price : null,
                    start_date = b.start_date,
                    end_date = b.end_date,
                    total_price = b.total_price,
                    status = b.status,
                    created_date = b.created_date,
                    pay_deadline = b.pay_deadline
                })
                .OrderByDescending(b => b.created_date)
                .ToListAsync();
            return Ok(orders);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.contract_id == id);
            if (booking == null) return NotFound($"沒有{id}");
            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
