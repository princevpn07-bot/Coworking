using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EquipmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var equipments = await _context.Equipments.ToListAsync();
            return Ok(equipments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var equipment = await _context.Equipments.FirstOrDefaultAsync(e => e.equipment_id == id);
            if (equipment == null) return NotFound($"沒有{id}");
            return Ok(equipment);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] Equipment Equipment)
        {
            _context.Equipments.Add(Equipment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), Equipment);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] Equipment Equipment)
        {
            var equipment = await _context.Equipments.FirstOrDefaultAsync(e => e.equipment_id == Equipment.equipment_id);
            if (equipment == null) return NotFound($"沒有{Equipment.equipment_id}");
            equipment.location_id = Equipment.location_id;
            equipment.category = Equipment.category;
            equipment.full_name = Equipment.full_name;
            equipment.create_date = Equipment.create_date;
            equipment.cost = Equipment.cost;
            equipment.total_amount = Equipment.total_amount;

            _context.Equipments.Update(equipment);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var equipment = await _context.Equipments.FirstOrDefaultAsync(e => e.equipment_id == id);
            if (equipment == null) return NotFound($"沒有{id}");
            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
