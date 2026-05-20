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
        public string? image {get; set;}
    }

    public class AdminSpaceAssertsDto
    {
        public int equipment_id { get; set; }
        public string? equipmentname { get; set; }
        public int? amount { get; set; }
    }
}
