using isRock.LineBot;

namespace CoworkingAPI.Services
{
    public interface ILineService
    {
        Task SendBookingConfirmationAsync(string lineUserId, string spaceName, string date, string timeRange, string confirmCode);
        Task SendTextAsync(string lineUserId, string message);
    }

    public class LineService : ILineService
    {
        private readonly string _channelAccessToken;

        public LineService(IConfiguration configuration)
        {
            _channelAccessToken = configuration["Line:ChannelAccessToken"]
                ?? throw new InvalidOperationException("Line:ChannelAccessToken is not configured.");
        }

        public bool IsValidChannelAccessToken()
        {
            // 這裡可以添加更嚴格的驗證邏輯，例如檢查 token 的格式或嘗試使用 token 發送測試消息
            return !string.IsNullOrWhiteSpace(_channelAccessToken) 
                && _channelAccessToken != "YOUR_CHANNEL_ACCESS_TOKEN"
                && _channelAccessToken.Length > 10;
        }

        public async Task SendBookingConfirmationAsync(string lineUserId, string spaceName, string date, string timeRange, string confirmCode)
        {
            if (!IsValidChannelAccessToken())
            {
                Console.WriteLine("Error: Invalid or placeholder LINE Channel Access Token configured.");
                return; // 或 throw exception
            }

            var message = $"🎉 CoWork 預約確認\n\n" +
                          $"您好，您的預約已成功！\n\n" +
                          $"📍 空間：{spaceName}\n" +
                          $"📅 日期：{date}\n" +
                          $"🕐 時間：{timeRange}\n" +
                          $"🔑 確認碼：{confirmCode}\n\n" +
                          $"當天請出示確認碼入場，感謝您選擇 CoWork！";

            // todo:
            // 使用者如果沒有串 line bot 就會失敗，應該要在前端做檢查，或是這裡做錯誤處理
            try
            {
                await Task.Run(() => Utility.PushMessage(lineUserId, message, _channelAccessToken));
            }
            catch (Exception ex)
            {
                // Log the error (you can use a logging framework like Serilog, NLog, etc.)
                Console.WriteLine($"Failed to send LINE message to user {lineUserId}: {ex.Message}");
                // Optionally, you could rethrow the exception or handle it according to your application's needs
            }
        }

        public async Task SendTextAsync(string lineUserId, string message)
        {
            await Task.Run(() => Utility.PushMessage(lineUserId, message, _channelAccessToken));
        }
    }
}
