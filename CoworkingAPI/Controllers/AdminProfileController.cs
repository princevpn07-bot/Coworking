using System.Security.Claims;
using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminProfileController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/AdminProfile/me
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            var email = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == email);
            if (user == null) return NotFound("找不到使用者");

            return Ok(new AdminUserProfileDto
            {
                Name = user.name,
                Email = user.email,
                Role = user.role,
                LineId = user.line_id
            });
        }

        // PATCH api/AdminProfile/updatename
        [HttpPatch("updatename")]
        public async Task<IActionResult> UpdateName([FromBody] AdminUserProfileDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == email);
            if (user == null) return NotFound("找不到使用者");

            user.name = dto.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH api/AdminProfile/changepassword
        [HttpPatch("changepassword")]
        public async Task<IActionResult> ChangePassword([FromBody] AdminChangePasswordDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == email);
            if (user == null) return NotFound("找不到使用者");

            if (user.password != dto.CurrentPassword) return BadRequest("當前密碼錯誤");

            user.password = dto.NewPassword;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
