using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    [Table("equipment")]
    public class Equipment
    {
        [Key]
        public int equipment_id { get; set; }
        [ForeignKey("Location")]
        public int? location_id { get; set; }
        public string? category { get; set; }
        public string? full_name { get; set; }
        public DateTime? create_date { get; set; }
        public decimal? cost { get; set; }
        public int? total_amount { get; set; }

        [JsonIgnore]
        public Location? Location { get; set; }
    }
}
