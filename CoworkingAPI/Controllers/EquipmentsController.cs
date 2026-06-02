using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Dto;
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

        [HttpGet("GetAllCards")]
        public async Task<IActionResult> GetAllCards()
        {
            var equipments = await _context.Equipments
                .Include(e => e.Location)
                .ToListAsync();

            var spaceAsserts = await _context.spaceasserts
                .Include(sa => sa.space)
                .ToListAsync();

            var result = equipments.Select(e => new AdminEquipmentCardDto
            {
                equipment_id = e.equipment_id,
                category    = e.category,
                full_name   = e.full_name,
                create_date = e.create_date,
                total_amount = e.total_amount,
                location_id   = e.location_id,
                location_name = e.Location?.city,
                is_precious = e.cost > 10000,
                allocations = spaceAsserts
                    .Where(sa => sa.equipment_id == e.equipment_id)
                    .Select(sa => new AdminSpaceAllocationDto
                    {
                        asserts_id = sa.asserts_id,
                        space_id   = sa.space_id ?? 0,
                        space_name = sa.space?.space_number,
                        amount     = sa.amount ?? 0
                    }).ToList()
            }).ToList();

            return Ok(result);
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
