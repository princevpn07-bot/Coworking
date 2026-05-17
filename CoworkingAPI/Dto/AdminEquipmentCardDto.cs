namespace CoworkingAPI.Dto
{
    public class AdminEquipmentCardDto
    {
        public int equipment_id { get; set; }
        public string? category { get; set; }
        public string? full_name { get; set; }
        public DateTime? create_date { get; set; }
        public int? total_amount { get; set; }
        public string? location_name { get; set; }
        public bool is_precious { get; set; }
        public List<AdminSpaceAllocationDto> allocations { get; set; } = new();
    }
}
