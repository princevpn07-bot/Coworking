namespace CoworkingAPI.Dto
{
    public class AdminBookingDetailDto
    {
        public int contract_id {get; set;}
        public string? username {get; set;}
        public string? email {get; set;}
        public string? companyname {get; set;}
        public string? tax_id {get; set;}
        public int? price_type {get; set;}
        public DateTime? start_date {get; set;}
        public DateTime? end_date {get; set;}
        public decimal? total_price {get; set;}
        public int? status {get; set;}
    }
}
