using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpacesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SpacesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var space = await _context.Spaces.ToListAsync();
            return Ok(space);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.space_id == id);
            if (space == null) return NotFound($"沒有{id}");
            return Ok(space);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] Space Space)
        {
            _context.Spaces.Add(Space);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), Space);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] Space Space)
        {
            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.space_id == Space.space_id);
            if (space == null) return NotFound($"沒有{Space.space_id}");
            space.location_id = Space.location_id;
            space.space_number = Space.space_number;
            space.capacity = Space.capacity;
            space.status = Space.status;
            space.image = Space.image;

            _context.Spaces.Update(space);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        
        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.space_id == id);
            if (space == null) return NotFound($"沒有{id}");
            _context.Spaces.Remove(space);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
