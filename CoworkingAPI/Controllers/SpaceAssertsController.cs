using System;
using CoworkingAPI.Data;
using CoworkingAPI.Dto;
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

        [HttpGet("ByEquipment/{equipment_id}")]
        public async Task<IActionResult> GetByEquipment(int equipment_id)
        {
            var allocations = await _context.spaceasserts
                .Where(sa => sa.equipment_id == equipment_id)
                .Include(sa => sa.space)
                .Select(sa => new AdminSpaceAllocationDto
                {
                    asserts_id = sa.asserts_id,
                    space_id   = sa.space_id ?? 0,
                    space_name = sa.space != null ? sa.space.space_number : null,
                    amount     = sa.amount ?? 0
                })
                .ToListAsync();

            return Ok(allocations);
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

        [HttpPost("Transfer")]
        public async Task<IActionResult> Transfer([FromBody] TransferAssertDto dto)
        {
            var source = await _context.spaceasserts.FirstOrDefaultAsync(a => a.asserts_id == dto.asserts_id);
            if (source == null) return NotFound("找不到來源資產");
            if (dto.amount <= 0 || dto.amount > source.amount) return BadRequest("轉移數量不合法");
            if (source.space_id == dto.to_space_id) return BadRequest("目標空間與來源相同");

            // 減少來源數量
            source.amount -= dto.amount;
            if (source.amount == 0)
                _context.spaceasserts.Remove(source);

            // 增加目標空間數量
            var target = await _context.spaceasserts.FirstOrDefaultAsync(
                a => a.space_id == dto.to_space_id && a.equipment_id == source.equipment_id);
            if (target != null)
                target.amount = (target.amount ?? 0) + dto.amount;
            else
                _context.spaceasserts.Add(new SpaceAsserts
                {
                    space_id = dto.to_space_id,
                    equipment_id = source.equipment_id,
                    amount = dto.amount
                });

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




