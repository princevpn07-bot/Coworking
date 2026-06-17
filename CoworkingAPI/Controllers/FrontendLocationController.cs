using CoworkingAPI.Data;
using CoworkingAPI.Dto;
using CoworkingAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // 💡 這行會讓你的路由自動變成 api/FrontendLocation
    public class FrontendLocationController : ControllerBase
    {
        private readonly AppDbContext _context; // 💡 請把 YourDbContext 改成你們專案實際的 DbContext 名稱
        public FrontendLocationController(AppDbContext context)
        {
            _context = context;
        }
        // 🌟 前台撈取所有空間卡片資訊的 100% 純動態 API
        [HttpGet("GetFrontendSpaces")]
        public async Task<IActionResult> GetFrontendSpaces(
            [FromQuery] string? keyword, [FromQuery] int? capacity, [FromQuery] DateTime? date, [FromQuery] TimeSpan? startTime, [FromQuery] TimeSpan? endTime)
        {

            try
            { 
                // 1. 建立基本查詢（此時還沒真正去查資料庫）
                var query = _context.Spaces.Include(s => s.Location).AsQueryable();

                // ============================================================
                // ⚡ 核心時段式日期篩選（排除該時段內已被預約的空間）
                // ============================================================
                if (date.HasValue && startTime.HasValue && endTime.HasValue)
                {
                    // 把前端傳來的日期與時間，組合成後端比對用的完整 DateTime
                    DateTime searchStart = date.Value.Date + startTime.Value;
                    DateTime searchEnd = date.Value.Date + endTime.Value;

                    // 🔍 交叉重疊判定公式：(別人開始時間 < 我的結束時間) AND (別人結束時間 > 我的開始時間)
                    // 只要滿足以條件，代表該空間在這個時段「被佔用了」，!Any 負責把它踢除
                    query = query.Where(s => !_context.Bookings.Any(b =>
                        // 💡 透過 Rents 表，把 Booking 訂單與目前這個 Space 串起來
                        _context.Rents.Any(r => r.rent_id == b.rent_id && r.space_id == s.space_id) &&
                        b.status != 2 &&             // 排除已取消的訂單 (status 2 = 已取消)
                        b.start_date < searchEnd &&  // 關鍵衝突判定：合約開始時間小於搜尋結束時間
                        b.end_date > searchStart     // 關鍵衝突判定：合約結束時間大於搜尋開始時間
                    ));
                }

                // 🌟 核心搜尋邏輯：如果前端有傳入關鍵字，就啟動過濾機制
                if (!string.IsNullOrEmpty(keyword))
                {
                    keyword = keyword.Trim().ToLower();
                    query = query.Where(s =>
                        (s.space_number != null && s.space_number.ToLower().Contains(keyword)) ||
                        (s.Location != null && s.Location.city != null && s.Location.city.ToLower().Contains(keyword)) ||
                        (s.Location != null && s.Location.mrt_info != null && s.Location.mrt_info.ToLower().Contains(keyword)) ||
                        (s.introduction != null && s.introduction.ToLower().Contains(keyword))
                    );
                }

                // 如果前端有選擇人數，就過濾出容量「大於或等於」該人數的空間
                if (capacity.HasValue && capacity.Value > 0)
                {
                    query = query.Where(s => (s.capacity ?? 0) >= capacity.Value);
                }
                // 1. 查詢 Spaces 主表，並預先載入對應的 Location 導覽屬性
                var spacesData = await query
                    .Include(s => s.Location)
                    .Select(s => new FrontendLocationDto
                    {
                        // 2. 填入來自 dbo.Spaces 表的實體欄位
                        space_id = s.space_id,
                        space_number = s.space_number ?? "",
                        capacity = s.capacity ?? 0,
                        status = s.status ?? 0,
                        introduction = s.introduction,
                        // 💡 用標準子查詢從 _context.rents 裡面撈出符合當前 space_id 且啟動中的價格
                        price = _context.Rents
                        .Where(r => r.space_id == s.space_id && r.is_active == true)
                        .Select(r => r.price)
                          .FirstOrDefault() ?? (decimal)((s.capacity ?? 0) * 500),


                        // 🔍 請把後端的 image_path 改成這樣：
                        image_path = _context.SpaceImages
                        .Where(i => i.space_id == s.space_id)
                        .Select(i => i.image_path)
                        .FirstOrDefault(), // 💡 拿掉後面的 ?? "assets/..."，讓它找不到就回傳 null

                        // 3. 填入來自 dbo.Locations 表的實體欄位 (若關聯為空則給予預設值防禦)
                        location_id = s.Location != null ? s.Location.location_id : 0,
                        country = s.Location != null ? s.Location.country : "台灣",
                        city = s.Location != null ? s.Location.city : "未知城市",
                        address = s.Location != null ? s.Location.address : "",
                        phone = s.Location != null ? s.Location.phone : "",
                        longitude = s.Location != null ? s.Location.longitude : 0,
                        latitude = s.Location != null ? s.Location.latitude : 0,
                        mrt_info = s.Location != null ? s.Location.mrt_info : "捷運站步行可達"
                          
                    })
                    .ToListAsync();

                return Ok(spacesData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"資料庫連線或跨表查詢失敗: {ex.Message}");
            }
        }
    }
}
