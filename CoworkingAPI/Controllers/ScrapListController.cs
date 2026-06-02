using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;
using CoworkingAPI.Dto;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScrapListController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ScrapListController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.ScrapLists.ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.ScrapLists.FirstOrDefaultAsync(s => s.scrap_id == id);
            if (item == null) return NotFound($"找不到 {id}");
            return Ok(item);
        }

        [HttpPost("Scrap")]
        public async Task<IActionResult> Scrap([FromBody] ScrapRequestDto dto)
        {
            if (dto.amount <= 0) return BadRequest("報廢數量必須大於 0");

            var spaceAssert = await _context.spaceasserts.FirstOrDefaultAsync(a => a.asserts_id == dto.asserts_id);
            if (spaceAssert == null) return NotFound("找不到該空間資產");
            if (dto.amount > spaceAssert.amount) return BadRequest($"報廢數量不能超過空間現有數量（{spaceAssert.amount}）");

            var equipment = await _context.Equipments.FirstOrDefaultAsync(e => e.equipment_id == spaceAssert.equipment_id);
            if (equipment == null) return NotFound("找不到對應設備");

            // 更新 space_asserts
            spaceAssert.amount -= dto.amount;
            if (spaceAssert.amount == 0)
                _context.spaceasserts.Remove(spaceAssert);

            // 更新 equipment 總數
            equipment.total_amount = (equipment.total_amount ?? 0) - dto.amount;

            // 寫入報廢紀錄
            _context.ScrapLists.Add(new ScrapList
            {
                space_id = spaceAssert.space_id,
                equipment_id = spaceAssert.equipment_id,
                amount = dto.amount,
                reason = dto.reason,
                create_date = DateTime.Now
            });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.ScrapLists.FirstOrDefaultAsync(s => s.scrap_id == id);
            if (item == null) return NotFound($"找不到 {id}");
            _context.ScrapLists.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
