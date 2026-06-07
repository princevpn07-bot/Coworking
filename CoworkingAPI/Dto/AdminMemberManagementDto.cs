using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace CoworkingAPI.Dto
{
    public class AdminMemberManagementDto
    {
        public int? TotalMembers { get; set; } 
        public int? ActiveBookingUsers { get; set; } 
        public int? SuspendedCount { get; set; } 

        public List<MemberListItemDto>? MemberList { get; set; }
        public int? Total { get; set; }
    }

    public class MemberListItemDto
    {
        public int? UserId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public int? TotalBookings { get; set; }
        public bool? Status { get; set; }
        public string? LineId { get; set; }
    }

    public class UpdateLineIdDto
    {
        public string? LineId { get; set; }
    }

    public class UpdateRoleDto
    {
        public string? Department { get; set; }
        public string? JobTitle { get; set; }
        public int? LocationId { get; set; }
        public DateOnly? Birth { get; set; }
    }

    public class CreateMemberDto
    {
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$",
            ErrorMessage = "密碼至少 6 位，需包含大寫、小寫字母及特殊符號")]
        public string? Password { get; set; }
        public int? Role { get; set; }
        public string? Department { get; set; }
        public string? JobTitle { get; set; }
        public int? LocationId { get; set; }
        public DateOnly? Birth { get; set; }
    }
}