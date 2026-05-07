using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;
using CoworkingAPI.Dto;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.ComponentModel;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public UsersController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
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
            user.name = User.name;
            user.email = User.email;
            user.password = User.password;
            user.image = User.image;
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

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody]Login login)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == login.email && u.password == login.password);
            if (user == null) return Unauthorized("帳號或密碼錯誤");
            var jwtsetting = _config.GetSection("JwtSettings");
            var issuer = jwtsetting.GetValue<string>("Issuer");
            var audience = jwtsetting.GetValue<string>("Audience");
            var secretkey = jwtsetting.GetValue<string>("Key");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretkey!));
            var crypt = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.email!),
                new Claim(JwtRegisteredClaimNames.Jti,Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, user.role.ToString()!)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: crypt
            );
            return Ok(new {token = new JwtSecurityTokenHandler().WriteToken(token)});

        }
    }
}
