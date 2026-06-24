namespace CoworkingAPI.Dto
{
    public class AdminSpaceInfoDto
    {
        public int space_id {get; set;}
        public int? location_id {get; set;}
        public string? locationname {get; set;}
        public string? spacename {get; set;}
        public int? capacity {get; set;}
        public int? status {get; set;}
        public int? assetcount {get; set;}
        public string? imagePath {get; set;}
        public string? introduction {get; set;}
        public decimal? hourly_price {get; set;}
        public decimal? daily_price {get; set;}
        public decimal? monthly_price {get; set;}
    }

    public class UpdateRentDto
    {
        public decimal? hourly_price { get; set; }
        public decimal? daily_price { get; set; }
        public decimal? monthly_price { get; set; }
    }

    public class AdminSpaceAssertsDto
    {
        public int asserts_id { get; set; }
        public int equipment_id { get; set; }
        public string? equipmentname { get; set; }
        public int? amount { get; set; }
    }

    public class TransferAssertDto
    {
        public int asserts_id { get; set; }
        public int to_space_id { get; set; }
        public int amount { get; set; }
    }

    public class ScrapRequestDto
    {
        public int asserts_id { get; set; }
        public int amount { get; set; }
        public string? reason { get; set; }
    }

    public class CreateSpaceDto
    {
        public int location_id { get; set; }
        public string space_number { get; set; } = "";
        public int capacity { get; set; }
        public int status { get; set; }
        public string? introduction { get; set; }
        public decimal? hourly_price { get; set; }
        public decimal? daily_price { get; set; }
        public decimal? monthly_price { get; set; }
    }
}
