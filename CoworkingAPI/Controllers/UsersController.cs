using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add([FromBody] User User)
        {
            _context.Users.Add(User);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), User);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] User User)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.user_id == User.user_id);
            if (user == null) return NotFound($"沒有{User.user_id}");
            user.company_id = User.company_id;
            user.email = User.email;
            user.password = User.password;
            user.name = User.name;
            user.phone = User.phone;
            user.role = User.role;
            user.line_id = User.line_id;
            user.is_active = User.is_active;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.user_id == id);
            if (user == null) return NotFound($"沒有{id}");
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
