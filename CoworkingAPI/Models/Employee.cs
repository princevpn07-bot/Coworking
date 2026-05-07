using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    [Table("employees")]
    public class Employee
    {
        [Key]
        public int employees_id { get; set; }
        [ForeignKey("User")]
        public int? user_id { get; set; }
        [ForeignKey("Location")]
        public int? location_id { get; set; }
        public DateOnly? birth { get; set; }
        public string? department { get; set; }
        public string? job_title { get; set; }
        public bool? is_active { get; set; }

        [JsonIgnore]
        public User? User { get; set; }
        [JsonIgnore]
        public Location? Location { get; set; }
    }
}
