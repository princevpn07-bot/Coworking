using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoworkingAPI.Models
{
    public class Contract
    {
        [Key]
        public int contract_id { get; set; }
        [ForeignKey("Company")]
        public int? company_id { get; set; }
        [ForeignKey("Space")]
        public int? space_id { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public decimal? deposit { get; set; }
        public bool? is_active { get; set; }

        public Company? Company { get; set; }
        public Space? Space { get; set; }
    }
}
