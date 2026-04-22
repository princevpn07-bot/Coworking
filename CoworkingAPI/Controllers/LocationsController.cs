using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using Microsoft.EntityFrameworkCore;
using CoworkingAPI.Models;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var location = await _context.Locations.ToListAsync();
            return Ok(location);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody]Location Location)
        {
            var location = _context.Locations.Add(Location);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), location);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] Location Location)
        {
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.location_id == Location.location_id);
            if (location == null) return NotFound($"沒有{Location.location_id}");
            location.country = Location.country;
            location.city = Location.city;
            location.building_name = Location.building_name;
            location.address = Location.address;

            _context.Locations.Update(location);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.location_id == id);
            if (location == null) return NotFound($"沒有{id}");
            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();
            return NoContent();
        }

    }
}
