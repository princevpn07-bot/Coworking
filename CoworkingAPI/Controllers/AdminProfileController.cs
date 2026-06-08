using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using CoworkingAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
            //var email = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = User.FindFirstValue(ClaimTypes.NameIdentifier)
         ?? User.FindFirstValue(ClaimTypes.Email)
         ?? User.FindFirstValue("email");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == email);
            if (user == null) return NotFound("找不到使用者");

            // a. 跨表尋找員工資訊（從內建的 Employees DbSet 撈取小寫 job_title）
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.user_id == user.user_id);

            // b. 跨表尋找該用戶最新一筆合約（從內建的 Bookings DbSet 撈取小寫 company_name）
            var latestBooking = await _context.Bookings
                .Where(b => b.user_id == user.user_id)
                .OrderByDescending(b => b.created_date) // 依小寫建立時間排序
                .FirstOrDefaultAsync();

            return Ok(new AdminUserProfileDto
            {
                Name = user.name,
                Email = user.email,
                Role = user.role,
                LineId = user.line_id,
                Phone = user.phone,
                Image = user.image,
                Address = user.address,

                Bio = user.bio,
                Industry = user.industry,
                TwoFactorEnabled = user.two_factor_enabled,
                // 🌟 從其他資料表整合過來的欄位
                JobTitle = employee?.job_title ?? "暫無職稱",
                CompanyName = latestBooking?.company_name ?? "個人用戶",
            });
        }

        // 🌟 2. 加上這段全新路由：PUT api/AdminProfile/update (一次性儲存更新個人資料)
        [HttpPut("update")]
        public async Task<IActionResult> UpdateProfile([FromBody] AdminUserProfileDto dto)
        {
            if (dto == null) return BadRequest("傳送的資料不能為空");

            // 套用防呆 Token 標籤抓取法
            var email = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue(ClaimTypes.Email)
                     ?? User.FindFirstValue("email");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == email);
            if (user == null) return NotFound("找不到使用者");

            // 將前端透過 DTO 帶過來的各欄位新數值，精準寫入資料庫
            user.name = dto.Name;
            user.phone = dto.Phone;
            user.line_id = dto.LineId;
            user.image = dto.Image;
            user.address = dto.Address;
            user.bio = dto.Bio;
            user.industry = dto.Industry;
            user.two_factor_enabled = dto.TwoFactorEnabled;

            // 跨表同步更新員工表的 JobTitle
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.user_id == user.user_id);
            if (employee != null) employee.job_title = dto.JobTitle;

            // 跨表同步更新最新一筆預約的公司名稱
            var latestBooking = await _context.Bookings
                .Where(b => b.user_id == user.user_id)
                .OrderByDescending(b => b.created_date)
                .FirstOrDefaultAsync();
            if (latestBooking != null) latestBooking.company_name = dto.CompanyName;

            await _context.SaveChangesAsync();
            return NoContent(); // RESTful 標準：更新成功回傳 204
        }

        // PATCH api/AdminProfile/updatename
        [HttpPatch("updatename")]
        public async Task<IActionResult> UpdateName([FromBody] AdminUserProfileDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.email == email);
            if (user == null) return NotFound("找不到使用者");

            user.name = dto.Name;

            user.phone = dto.Phone;
            user.line_id = dto.LineId;
            user.image = dto.Image;
            user.address = dto.Address;

            user.bio = dto.Bio;
            user.industry = dto.Industry;
            user.two_factor_enabled = dto.TwoFactorEnabled; // 畫面上 2FA 切換開關會觸發這裡

            // 跨表同步職稱與公司名稱
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.user_id == user.user_id);
            if (employee != null) employee.job_title = dto.JobTitle;

            var latestBooking = await _context.Bookings
                .Where(b => b.user_id == user.user_id)
                .OrderByDescending(b => b.created_date)
                .FirstOrDefaultAsync();
            if (latestBooking != null) latestBooking.company_name = dto.CompanyName;

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
