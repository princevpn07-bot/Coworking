namespace CoworkingAPI.Dto
{
    public class CreateBookingDto
    {
        public int? user_id { get; set; }
        public int? rent_id { get; set; }
        public int? employees_id { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public string? company_name { get; set; }
        public string? tax_id { get; set; }
        public int? status { get; set; }
    }
}
