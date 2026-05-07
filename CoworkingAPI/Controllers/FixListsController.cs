using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FixListsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FixListsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var fixlists = await _context.FixLists.ToListAsync();
            return Ok(fixlists);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var fixlist = await _context.FixLists.FirstOrDefaultAsync(f => f.fix_id == id);
            if (fixlist == null) return NotFound($"沒有{id}");
            return Ok(fixlist);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] FixList FixList)
        {
            _context.FixLists.Add(FixList);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), FixList);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] FixList FixList)
        {
            var fixlist = await _context.FixLists.FirstOrDefaultAsync(f => f.fix_id == FixList.fix_id);
            if (fixlist == null) return NotFound($"沒有{FixList.fix_id}");
            fixlist.space_id = FixList.space_id;
            fixlist.category = FixList.category;
            fixlist.create_date = FixList.create_date;
            fixlist.completion_date = FixList.completion_date;
            fixlist.is_active = FixList.is_active;

            _context.FixLists.Update(fixlist);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var fixlist = await _context.FixLists.FirstOrDefaultAsync(f => f.fix_id == id);
            if (fixlist == null) return NotFound($"沒有{id}");
            _context.FixLists.Remove(fixlist);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
