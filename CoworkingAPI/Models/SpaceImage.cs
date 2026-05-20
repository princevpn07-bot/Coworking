using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models
{
    [Table("spaceimage")]
    public class SpaceImage
    {
        [Key]
        public int Id { get; set; }
        [ForeignKey("Space")]
        public int space_id { get; set; }
        public string? image_path { get; set; }

        [JsonIgnore]
        public Space? Space { get; set; }
    }
}
