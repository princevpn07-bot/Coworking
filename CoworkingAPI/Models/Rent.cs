using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    [Table("rents")]
    public class Rent
    {
        [Key]
        public int rent_id { get; set; }
        [ForeignKey("Space")]
        public int? space_id { get; set; }
        public int? price_type { get; set; }
        public decimal? price { get; set; }
        public bool? is_active { get; set; }

        [JsonIgnore]
        public Space? Space { get; set; }
    }
}
