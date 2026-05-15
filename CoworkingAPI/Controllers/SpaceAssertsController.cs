using System;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class SpaceAssertsController: ControllerBase
    {
        private readonly AppDbContext _context;
        public SpaceAssertsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var assert = await _context.spaceasserts.ToListAsync();
            return Ok(assert);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult>GetId(int id)
        {
            var assert = await _context.spaceasserts.FirstOrDefaultAsync(a => a.asserts_id == id);
            if (assert == null) return NotFound($"找不到{id}");
            return Ok(assert);
        }

        [HttpPost("Add")]
        public async Task<IActionResult>Add([FromBody]SpaceAsserts spaceAsserts)
        {
            _context.spaceasserts.Add(spaceAsserts);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll),spaceAsserts);
        }

        [HttpPut("Update")]
        public async Task<IActionResult>Update([FromBody]SpaceAsserts spaceAsserts)
        {
            var assert = await _context.spaceasserts.FirstOrDefaultAsync(a => a.asserts_id == spaceAsserts.asserts_id);
            if (assert == null) return NotFound($"找不到{spaceAsserts.asserts_id}");
            assert.space_id = spaceAsserts.space_id;
            assert.equipment_id = spaceAsserts.equipment_id;
            assert.amount = spaceAsserts.amount;

            _context.spaceasserts.Update(assert);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult>Delete(int id)
        {
            var assert = await _context.spaceasserts.FirstOrDefaultAsync(a => a.asserts_id == id);
            if (assert == null) return NotFound($"找不到{id}");
            _context.spaceasserts.Remove(assert);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}




