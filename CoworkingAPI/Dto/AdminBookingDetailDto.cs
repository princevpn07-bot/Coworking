using System.ComponentModel.DataAnnotations;

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

     public class AdminBookingListDto
    {
        public int contract_id {get; set;}
        public string? username {get; set;}
        public string? spacename {get; set;}
        public DateTime start_date {get; set;}
        public int status {get; set;}

    }

    public class CreateBookingDto : IValidatableObject
    {
        public int? user_id { get; set; }
        public int? rent_id { get; set; }
        public int? employees_id { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public string? company_name { get; set; }
        public string? tax_id { get; set; }
        public int? status { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (start_date.HasValue && start_date.Value <= DateTime.Now)
            {
                yield return new ValidationResult(
                    "開始時間不能是過去的時間",
                    new[] { nameof(start_date) }
                );
            }

            if (start_date.HasValue && end_date.HasValue)
            {
                if (end_date <= start_date)
                {
                    yield return new ValidationResult(
                        "結束時間不能早於或等於開始時間",
                        new[] {nameof(end_date)}
                    );
                }
            }
        }
    }
}
