using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Data;
using CoworkingAPI.Models;
using Microsoft.EntityFrameworkCore;
using CoworkingAPI.Dto;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using System.Net.Mail;
using System.Net;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;

        public UsersController(AppDbContext context, IConfiguration config, IMemoryCache cache)
        {
            _context = context;
            _config = config;
            _cache = cache;
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

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            var exists = await _context.Users.AnyAsync(u => u.email == user.email);
            if (exists) return Conflict("此 Email 已被註冊");
            user.role = 20;
            user.is_active = true;
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] Login login)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == login.email && u.password == login.password);
            if (user == null) return Unauthorized("帳號或密碼錯誤");

            if (user.two_factor_enabled)
            {
                var otp = Random.Shared.Next(100000, 999999).ToString();
                _cache.Set($"otp:{user.email}", otp, TimeSpan.FromMinutes(5));
                SendOtpEmail(user.email!, otp);
                return Ok(new { require2fa = true });
            }

            return Ok(new { token = GenerateJwt(user) });
        }

        [HttpPost("VerifyOtp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var cachedOtp = _cache.Get<string>($"otp:{dto.Email}");
            if (cachedOtp == null) return BadRequest("驗證碼已過期，請重新登入");
            if (cachedOtp != dto.Otp) return Unauthorized("驗證碼錯誤");

            _cache.Remove($"otp:{dto.Email}");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == dto.Email);
            if (user == null) return Unauthorized();

            return Ok(new { token = GenerateJwt(user) });
        }

        private string GenerateJwt(User user)
        {
            var jwtsetting = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtsetting["Key"]!));
            var crypt = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            string? locationIdClaim = null;
            if (user.role == 80 || user.role == 99)
            {
                var employee = _context.Employees
                    .FirstOrDefault(e => e.user_id == user.user_id && e.is_active == true);
                if (employee?.location_id != null)
                    locationIdClaim = employee.location_id.ToString();
            }
            else if (user.role == 60)
            {
                var ownedLocation = _context.Locations
                    .FirstOrDefault(l => l.owner_user_id == user.user_id);
                if (ownedLocation != null)
                    locationIdClaim = ownedLocation.location_id.ToString();
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.user_id.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, user.email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, user.role.ToString()!),
                new Claim("user_id", user.user_id.ToString()),
                new Claim("location_id", locationIdClaim ?? "")
            };

            var token = new JwtSecurityToken(
                issuer: jwtsetting["Issuer"],
                audience: jwtsetting["Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: crypt
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private void SendOtpEmail(string toEmail, string otp)
        {
            try
            {
                var settings = _config.GetSection("EmailSettings");
                var host = settings["SmtpHost"] ?? "smtp.gmail.com";
                var port = int.Parse(settings["SmtpPort"] ?? "587");
                var senderEmail = settings["SenderEmail"]!;
                var senderPassword = settings["SenderPassword"]!;

                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(senderEmail, senderPassword),
                    EnableSsl = true
                };

                var mail = new MailMessage
                {
                    From = new MailAddress(senderEmail, "WorkspaceCollective"),
                    Subject = "【WorkspaceCollective】登入驗證碼",
                    IsBodyHtml = true,
                    Body = $@"
                        <div style='font-family: serif; max-width: 480px; margin: 0 auto; padding: 40px; background: #fef8f6; border: 1px solid #cfc5bb; border-radius: 8px;'>
                          <h2 style='color: #1d1b1a; margin-bottom: 8px;'>安全驗證</h2>
                          <p style='color: #4c463e;'>您正在登入 WorkspaceCollective，請輸入以下驗證碼：</p>
                          <div style='font-size: 40px; letter-spacing: 12px; font-weight: 700; color: #695c4e; text-align: center; padding: 24px 0;'>{otp}</div>
                          <p style='color: #7e766d; font-size: 14px;'>此驗證碼將在 <strong>5 分鐘</strong>後失效。</p>
                          <p style='color: #7e766d; font-size: 14px;'>如果您沒有嘗試登入，請忽略此郵件。</p>
                        </div>"
                };
                mail.To.Add(toEmail);
                client.Send(mail);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[2FA] 發送 OTP 郵件失敗: {ex.Message}");
            }
        }
    }
}
