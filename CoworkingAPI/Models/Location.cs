using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

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

        [JsonIgnore]
        public ICollection<Space>? Spaces { get; set; }
        [JsonIgnore]
        public ICollection<Equipment>? Equipments { get; set; }
        [JsonIgnore]
        public ICollection<Employee>? Employees { get; set; }
    }
}
