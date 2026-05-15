using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoworkingAPI.Models;

[Table("space_asserts")]
public class SpaceAsserts
{
    [Key]
    public int asserts_id {get; set;}
    public int? space_id {get; set;}
    public int? equipment_id {get; set;}
    public int? amount {get; set;}

    [JsonIgnore]
    [ForeignKey("space_id")]
    public Space? space {get; set;}
    [JsonIgnore]
    [ForeignKey("equipment_id")]
    public Equipment? equipment {get; set;}
}
