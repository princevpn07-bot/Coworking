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

        public async Task SendBookingConfirmationAsync(string lineUserId, string spaceName, string date, string timeRange, string confirmCode)
        {
            var message = $"🎉 CoWork 預約確認\n\n" +
                          $"您好，您的預約已成功！\n\n" +
                          $"📍 空間：{spaceName}\n" +
                          $"📅 日期：{date}\n" +
                          $"🕐 時間：{timeRange}\n" +
                          $"🔑 確認碼：{confirmCode}\n\n" +
                          $"當天請出示確認碼入場，感謝您選擇 CoWork！";

            await Task.Run(() => Utility.PushMessage(lineUserId, message, _channelAccessToken));
        }

        public async Task SendTextAsync(string lineUserId, string message)
        {
            await Task.Run(() => Utility.PushMessage(lineUserId, message, _channelAccessToken));
        }
    }
}
