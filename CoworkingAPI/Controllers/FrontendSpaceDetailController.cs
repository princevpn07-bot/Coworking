using CoworkingAPI.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static CoworkingAPI.Dto.FrontendSpaceDetailDto;

namespace CoworkingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FrontendSpaceDetailController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FrontendSpaceDetailController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{spaceId}")]
        public async Task<IActionResult> GetSpaceDetail(int spaceId)
        {
            var dto = await _context.Spaces
        .Where(s => s.space_id == spaceId)
        .Select(s => new SpaceDetailDto
        {
            SpaceId = s.space_id,
            SpaceNumber = s.space_number,
            Capacity = s.capacity,
            Status = s.status,

            Location = s.Location == null ? null : new LocationDto
            {
                Country = s.Location.country,
                City = s.Location.city,
                Address = s.Location.address,
                Phone = s.Location.phone,
                MrtInfo = s.Location.mrt_info
            },

            Images = _context.SpaceImages
                .Where(i => i.space_id == s.space_id)
                .Select(i => new SpaceImageDto
                {
                    Id = i.Id,
                    ImagePath = i.image_path
                })
                .ToList(),

            Equipments = _context.spaceasserts
                .Where(sa => sa.space_id == s.space_id)
                .Select(sa => new EquipmentDto
                {
                    EquipmentId = sa.equipment.equipment_id,
                    Category = sa.equipment.category,
                    FullName = sa.equipment.full_name
                })
                .ToList(),

            Rents = _context.Rents
                .Where(r => r.space_id == s.space_id && r.is_active == true)
                .Select(r => new RentDto
                {
                    RentId = r.rent_id,
                    PriceType = r.price_type,
                    Price = r.price
                })
                .ToList()
        })
        .FirstOrDefaultAsync();

            if (dto == null)
                return NotFound();

            return Ok(dto);

        }
    }
}
