using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoworkingAPI.Models
{
    public class Company
    {
        [Key]
        public int company_id { get; set; }
        public string? company_name { get; set; }
        public string? tax_id { get; set; }
        public string? contact_name { get; set; }
        public string? contact_phone { get; set; }
        public string? contact_email { get; set; }
    }
}
