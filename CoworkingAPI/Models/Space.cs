using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    public class Space
    {
        [Key]
        public int space_id { get; set; }
        [ForeignKey("Location")]
        public int? location_id { get; set; }
        public string? space_number { get; set; }
        public int? capacity { get; set; }
        public int? status { get; set; }

        [JsonIgnore]
        public Location? Location { get; set; }
    }
}
