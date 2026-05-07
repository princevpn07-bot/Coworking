using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var rent = await _context.Rents.ToListAsync();
            return Ok(rent);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var rent = await _context.Rents.FirstOrDefaultAsync(r => r.rent_id == id);
            if (rent == null) return NotFound($"沒有{id}");
            return Ok(rent);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] Rent Rent)
        {
            _context.Rents.Add(Rent);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), Rent);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] Rent Rent)
        {
            var rent = await _context.Rents.FirstOrDefaultAsync(r => r.rent_id == Rent.rent_id);
            if (rent == null) return NotFound($"沒有{Rent.rent_id}");
            rent.space_id = Rent.space_id;
            rent.price_type = Rent.price_type;
            rent.price = Rent.price;
            rent.is_active = Rent.is_active;

            _context.Rents.Update(rent);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var rent = await _context.Rents.FirstOrDefaultAsync(r => r.rent_id == id);
            if (rent == null) return NotFound($"沒有{id}");
            _context.Rents.Remove(rent);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
