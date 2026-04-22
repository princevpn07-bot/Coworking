using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        public decimal? rent { get; set; }
        public bool? is_rented { get; set; }

        public Location? Location { get; set; }
    }
}
