namespace CoworkingAPI.Dto
{
    public class FrontendMyOrderDto
    {
        public int contract_id { get; set; }
        public int? space_id { get; set; }
        public string? space_name { get; set; }
        public string? location_city { get; set; }
        public string? location_address { get; set; }
        public int? price_type { get; set; }
        public decimal? price { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public decimal? total_price { get; set; }
        public int? status { get; set; }
        public DateTime? created_date { get; set; }
        public DateTime? pay_deadline { get; set; }
    }
}
