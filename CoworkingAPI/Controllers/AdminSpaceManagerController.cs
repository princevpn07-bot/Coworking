using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

        private int? GetLocationFilter()
        {
            var role = int.TryParse(User.FindFirst(ClaimTypes.Role)?.Value, out var r) ? r : 0;
            if (role == 99) return null;
            var locStr = User.FindFirst("location_id")?.Value;
            return int.TryParse(locStr, out var l) && l > 0 ? l : null;
        }

        [HttpGet("spaceinfo")]
        public async Task<IActionResult> spaceinfo()
        {
            var locationId = GetLocationFilter();
            var spaceinfo = await _context.Spaces
                .Where(s => !locationId.HasValue || s.location_id == locationId)
                .Select(s => new AdminSpaceInfoDto
            {
                space_id = s.space_id,
                location_id = s.location_id,
                locationname = s.Location != null ? s.Location.city : null,
                spacename = s.space_number,
                capacity = s.capacity,
                status = s.status,
                assetcount = _context.spaceasserts.Count(sa => sa.space_id == s.space_id),
                imagePath = _context.SpaceImages.Where(i => i.space_id == s.space_id).Select(i => i.image_path).FirstOrDefault(),
                introduction = s.introduction
            }).ToListAsync();

            return Ok(spaceinfo);
        }

        [HttpPost("createspace")]
        public async Task<IActionResult> CreateSpace([FromBody] CreateSpaceDto dto)
        {
            var space = new Space
            {
                location_id = dto.location_id,
                space_number = dto.space_number,
                capacity = dto.capacity,
                status = dto.status,
                introduction = dto.introduction
            };
            _context.Spaces.Add(space);
            await _context.SaveChangesAsync();

            var rents = new List<Rent>();
            if (dto.hourly_price.HasValue)
                rents.Add(new Rent { space_id = space.space_id, price_type = 1, price = dto.hourly_price, is_active = true });
            if (dto.daily_price.HasValue)
                rents.Add(new Rent { space_id = space.space_id, price_type = 2, price = dto.daily_price, is_active = true });
            if (dto.monthly_price.HasValue)
                rents.Add(new Rent { space_id = space.space_id, price_type = 3, price = dto.monthly_price, is_active = true });

            if (rents.Any())
            {
                _context.Rents.AddRange(rents);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(spaceinfo), new { id = space.space_id }, space);
        }

        [HttpGet("locations")]
        public async Task<IActionResult> GetLocations()
        {
            var role = int.TryParse(User.FindFirst(ClaimTypes.Role)?.Value, out var r) ? r : 0;
            var userId = int.TryParse(User.FindFirst("user_id")?.Value, out var u) ? u : 0;

            var query = _context.Locations.AsQueryable();
            if (role == 60)
                query = query.Where(l => l.owner_user_id == userId);

            var locations = await query
                .Select(l => new { l.location_id, l.city, l.address })
                .ToListAsync();

            return Ok(locations);
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
