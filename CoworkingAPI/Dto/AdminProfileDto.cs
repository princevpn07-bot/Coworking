namespace CoworkingAPI.Dto
{
    public class AdminUserProfileDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Image { get; set; }
        public int? Role { get; set; }
        public string? LineId { get; set; }
        public string? Address { get; set; }
        public string? Bio { get; set; }
        public string? CompanyName { get; set; }
        public string? JobTitle { get; set; }
        public string? Industry { get; set; }
        public bool TwoFactorEnabled { get; set; }
    }

    public class AdminChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
