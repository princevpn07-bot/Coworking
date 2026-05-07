using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoworkingAPI.Models
{
    public class User
    {
        [Key]
        public int user_id { get; set; }
        public string? name { get; set; }
        public string? email { get; set; }
        public string? password { get; set; }
        public string? image { get; set; }
        public string? phone { get; set; }
        public int? role { get; set; }
        public string? line_id { get; set; }
        public bool? is_active { get; set; }
    }
}
