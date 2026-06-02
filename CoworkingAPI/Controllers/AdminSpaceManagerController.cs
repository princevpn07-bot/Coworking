using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminSpaceManagerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminSpaceManagerController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("spaceinfo")]
        public async Task<IActionResult> spaceinfo()
        {
            var spaceinfo = await _context.Spaces.Select(s => new AdminSpaceInfoDto
            {
                space_id = s.space_id,
                location_id = s.location_id,
                locationname = s.Location != null ? s.Location.city : null,
                spacename = s.space_number,
                capacity = s.capacity,
                status = s.status,
                assetcount = _context.spaceasserts.Count(sa => sa.space_id == s.space_id),
                imagePath = _context.SpaceImages.Where(i => i.space_id == s.space_id).Select(i => i.image_path).FirstOrDefault()
            }).ToListAsync();
            return Ok(spaceinfo);
        }

        [HttpGet("assets/{space_id}")]
        public async Task<IActionResult> assets(int space_id)
        {
            var asset = await _context.spaceasserts
                .Where(a => a.space_id == space_id)
                .Select(a => new AdminSpaceAssertsDto
                {
                    asserts_id = a.asserts_id,
                    equipment_id = a.equipment_id ?? 0,
                    equipmentname = a.equipment != null ? a.equipment.full_name : null,
                    amount = a.amount
                }).ToListAsync();
            return Ok(asset);
        }
    }
}
