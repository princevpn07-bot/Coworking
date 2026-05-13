using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoworkingAPI.Models;

[Table("space_asserts")]
public class SpaceAsserts
{
    [Key]
    public int asserts_id {get; set;}
    [ForeignKey("Space")]
    public int space_id {get; set;}
    public string? category {get; set;}
    public decimal? amount {get; set;}
}
