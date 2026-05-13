using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    [Table("booking")]
    public class Booking
    {
        [Key]
        public int contract_id { get; set; }
        [ForeignKey("User")]
        public int? user_id { get; set; }
        [ForeignKey("Rent")]
        public int? rent_id { get; set; }
        [ForeignKey("Employee")]
        public int? employees_id { get; set; }
        public DateTime? created_date { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public string? company_name { get; set; }
        public string? tax_id { get; set; }
        public int? status { get; set; }
        public DateTime? pay_deadline { get; set; }
        public DateTime? cancelled_daedline { get; set; }
        public decimal? total_price { get; set; }

        [JsonIgnore]
        public User? User { get; set; }
        [JsonIgnore]
        public Rent? Rent {get; set;}
        [JsonIgnore]
        public Employee? Employee {get; set;}
        
    }
}
