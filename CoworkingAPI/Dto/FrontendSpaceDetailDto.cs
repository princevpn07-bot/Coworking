namespace CoworkingAPI.Dto
{
    public class FrontendSpaceDetailDto
    {
        public class SpaceDetailDto
        {
            public int SpaceId { get; set; }
            public string? SpaceNumber { get; set; }
            public int? Capacity { get; set; }
            public int? Status { get; set; }

            public LocationDto? Location { get; set; }

            public List<SpaceImageDto> Images { get; set; } = new();

            public List<EquipmentDto> Equipments { get; set; } = new();

            public List<RentDto> Rents { get; set; } = new();
        }

        public class SpaceImageDto
        {
            public int Id { get; set; }
            public string? ImagePath { get; set; }
        }

        public class LocationDto
        {
            public string? Country { get; set; }
            public string? City { get; set; }
            public string? Address { get; set; }
            public string? Phone { get; set; }
            public string? MrtInfo { get; set; }

        }

        public class EquipmentDto
        {
            public int EquipmentId { get; set; }
            public string? Category { get; set; }
            public string? FullName { get; set; }

        }

        public class RentDto
        {
            public int RentId { get; set; }
            public int? PriceType { get; set; }
            public decimal? Price { get; set; }
        }
    }
}
