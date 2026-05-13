using System.ComponentModel.DataAnnotations;

namespace CoworkingAPI.Dto
{
    public class AdminBookingListDto
    {
        public int contract_id {get; set;}
        public string? username {get; set;}
        public string? spacename {get; set;}
        public DateTime start_date {get; set;}
        public int status {get; set;}

    }
}
