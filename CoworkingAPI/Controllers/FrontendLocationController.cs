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
        public async Task<IActionResult> GetFrontendSpaces([FromQuery] string? keyword, [FromQuery] int? capacity)
        {
            try
            { 
                // 1. 建立基本查詢（此時還沒真正去查資料庫）
                var query = _context.Spaces.Include(s => s.Location).AsQueryable();

                // 🌟 核心搜尋邏輯：如果前端有傳入關鍵字，就啟動過濾機制
                if (!string.IsNullOrEmpty(keyword))
                {
                    keyword = keyword.Trim().ToLower();
                    query = query.Where(s =>
                        (s.space_number != null && s.space_number.ToLower().Contains(keyword)) ||
                        (s.Location != null && s.Location.city != null && s.Location.city.ToLower().Contains(keyword)) ||
                        (s.Location != null && s.Location.mrt_info != null && s.Location.mrt_info.ToLower().Contains(keyword))
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
                        // 💡 用標準子查詢從 _context.rents 裡面撈出符合當前 space_id 且啟動中的價格
                        price = _context.Rents
                        .Where(r => r.space_id == s.space_id && r.is_active == true)
                        .Select(r => r.price)
                          .FirstOrDefault() ?? (decimal)((s.capacity ?? 0) * 500),

                     
                        image_path = _context.SpaceImages
                            .Where(i => i.space_id == s.space_id)
                            .Select(i => i.image_path)
                            .FirstOrDefault() ?? "assets/Featured_space_01.png", // 💡 防破圖預設路徑

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
