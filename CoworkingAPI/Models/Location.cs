using System.ComponentModel.DataAnnotations;

namespace CoworkingAPI.Models
{
    public class Location
    {
        [Key]
        public int location_id { get; set; }
        public string? country { get; set; }
        public string? city { get; set; }
        public string? address { get; set; }
        public string? phone {get; set;}
        public decimal? longitude {get; set;}
        public decimal? latitude {get; set;}
    }
}
