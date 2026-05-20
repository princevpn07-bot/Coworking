using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpaceImagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public SpaceImagesController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var images = await _context.SpaceImages.ToListAsync();
            return Ok(images);
        }

        [HttpGet("GetBySpace/{space_id}")]
        public async Task<IActionResult> GetBySpace(int space_id)
        {
            var images = await _context.SpaceImages
                .Where(i => i.space_id == space_id)
                .ToListAsync();
            return Ok(images);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromForm] int space_id, IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest("請選擇圖片");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsPath = Path.Combine(webRoot, "uploads");
            Directory.CreateDirectory(uploadsPath);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
            using var stream = new FileStream(Path.Combine(uploadsPath, fileName), FileMode.Create);
            await image.CopyToAsync(stream);

            var spaceImage = new SpaceImage
            {
                space_id = space_id,
                image_path = $"/uploads/{fileName}"
            };
            _context.SpaceImages.Add(spaceImage);
            await _context.SaveChangesAsync();

            return Ok(spaceImage);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> Update(int id, IFormFile image)
        {
            var existing = await _context.SpaceImages.FirstOrDefaultAsync(i => i.Id == id);
            if (existing == null) return NotFound();

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            // 刪除舊檔案
            if (!string.IsNullOrEmpty(existing.image_path))
            {
                var oldPath = Path.Combine(webRoot, existing.image_path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }

            // 儲存新檔案
            var uploadsPath = Path.Combine(webRoot, "uploads");
            Directory.CreateDirectory(uploadsPath);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
            using var stream = new FileStream(Path.Combine(uploadsPath, fileName), FileMode.Create);
            await image.CopyToAsync(stream);

            existing.image_path = $"/uploads/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var image = await _context.SpaceImages.FirstOrDefaultAsync(i => i.Id == id);
            if (image == null) return NotFound();

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            if (!string.IsNullOrEmpty(image.image_path))
            {
                var filePath = Path.Combine(webRoot, image.image_path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
            }

            _context.SpaceImages.Remove(image);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
