using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    [Table("fix_list")]
    public class FixList
    {
        [Key]
        public int fix_id { get; set; }
        [ForeignKey("Space")]
        public int? space_id { get; set; }
        public string? category { get; set; }
        public DateTime? create_date { get; set; }
        public DateTime? completion_date { get; set; }
        public bool? is_active { get; set; }

        [JsonIgnore]
        public Space? Space { get; set; }
    }
}
