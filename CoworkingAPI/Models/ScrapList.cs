using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    [Table("scrap_list")]
    public class ScrapList
    {
        [Key]
        public int scrap_id { get; set; }
        [ForeignKey("Space")]
        public int? space_id { get; set; }
        [ForeignKey("Equipment")]
        public int? equipment_id { get; set; }
        public int? amount { get; set; }
        public string? reason { get; set; }
        public DateTime? create_date { get; set; }

        [JsonIgnore]
        public Space? Space { get; set; }
        [JsonIgnore]
        public Equipment? Equipment { get; set; }
    }
}
