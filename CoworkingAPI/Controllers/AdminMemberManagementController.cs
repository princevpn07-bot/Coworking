using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using CoworkingAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminMemberManagementController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminMemberManagementController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("memberpage")]
        public async Task<IActionResult> memberpage()
        {
            int totalmember = await _context.Users.CountAsync();

            int booked = await _context.Bookings.Where(b => b.start_date == DateTime.Today).Select(b => b.user_id).Distinct().CountAsync();

            int blocked = await _context.Users.CountAsync(m => m.is_active == false);

            var bookingCounts = await _context.Bookings
                .Where(b => b.user_id != null)
                .GroupBy(b => b.user_id!.Value)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            var memberlist = await _context.Users.Select(m => new MemberListItemDto
            {
                UserId = m.user_id,
                Name = m.name,
                Email = m.email,
                Role = m.role == 99 ? "admin" : m.role == 80 ? "staff" : m.role == 20 ? "client" : "unknown",
                Status = m.is_active,
                LineId = m.line_id
            }).ToListAsync();

            foreach (var member in memberlist)
            {
                member.TotalBookings = bookingCounts.TryGetValue(member.UserId ?? 0, out var count) ? count : 0;
            }

            var memberpage = new AdminMemberManagementDto
            {
                TotalMembers = totalmember,
                ActiveBookingUsers = booked,
                SuspendedCount = blocked,
                MemberList = memberlist,
                Total = memberlist.Count
            };
            return Ok(memberpage);
        }

        [HttpPatch("updaterole/{id}/{role}")]
        public async Task<IActionResult> UpdateRole(int id, int role)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("找不到該會員");
            user.role = role;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("resetpassword/{id}")]
        public async Task<IActionResult> ResetPassword(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("找不到該會員");
            user.password = "123456";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("toggleblock/{id}")]
        public async Task<IActionResult> ToggleBlock(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("找不到該會員");
            user.is_active = !(user.is_active ?? true);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("updatelineid/{id}")]
        public async Task<IActionResult> UpdateLineId(int id, [FromBody] UpdateLineIdDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("找不到該會員");
            user.line_id = dto.LineId;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("createuser")]
        public async Task<IActionResult>createuser([FromBody] CreateMemberDto dto)
        {
            var isemailexists = await _context.Users.AnyAsync(e => e.email == dto.Email);
            if (isemailexists) return BadRequest("該 Email 已被註冊");

            var newUser = new User
            {
                name = dto.Name,
                phone = dto.Phone,
                email = dto.Email,
                password = dto.Password,
                image = null,
                role = dto.Role,
                line_id = null,
                is_active = true
            };
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(memberpage), newUser);
        }
    }
}