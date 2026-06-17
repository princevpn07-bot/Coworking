namespace CoworkingAPI.Dto
{
    public class FrontendLocationDto
    {

        // === 來自 dbo.Spaces 表的欄位 ===
        public int space_id { get; set; }
        public string space_number { get; set; }
        public int? capacity { get; set; }
        public int? status { get; set; }

        // === 完美對應 dbo.Locations 實體資料行名稱 (包含 Null 允許) ===
        public int location_id { get; set; }
        public string country { get; set; }
        public string city { get; set; }
        public string address { get; set; }
        public string phone { get; set; }
        public decimal? longitude { get; set; }
        public decimal? latitude { get; set; }
        public string mrt_info { get; set; } // 🌟 最關鍵的真捷運欄位

        public string? introduction { get; set; }

        public string? image_path { get; set; }

        public decimal price { get; set; }
    }
}
