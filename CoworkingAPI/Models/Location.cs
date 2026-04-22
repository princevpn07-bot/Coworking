using System.ComponentModel.DataAnnotations;

namespace CoworkingAPI.Models
{
    public class Location
    {
        [Key]
        public int location_id { get; set; }
        public string? country { get; set; }
        public string? city { get; set; }
        public string? building_name { get; set; }
        public string? address { get; set; }
    }
}
