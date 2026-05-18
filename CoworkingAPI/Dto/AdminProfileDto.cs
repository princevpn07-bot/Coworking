namespace CoworkingAPI.Dto
{
    public class AdminUserProfileDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public int? Role { get; set; }
    }

    public class AdminChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
