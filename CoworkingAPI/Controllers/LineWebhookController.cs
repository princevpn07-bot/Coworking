using isRock.LineBot;
using CoworkingAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LineWebhookController : ControllerBase
    {
        private readonly string _channelSecret;
        private readonly string _channelAccessToken;
        private readonly AppDbContext _context;

        public LineWebhookController(IConfiguration configuration, AppDbContext context)
        {
            _channelSecret = configuration["Line:ChannelSecret"]
                ?? throw new InvalidOperationException("Line:ChannelSecret is not configured.");

            _channelAccessToken = configuration["Line:ChannelAccessToken"]
                ?? throw new InvalidOperationException("Line:ChannelAccessToken is not configured.");

            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Webhook()
        {
            string postData;
            using (var reader = new StreamReader(Request.Body))
            {
                postData = await reader.ReadToEndAsync();
            }

#pragma warning disable CS8604 // 可能有 Null 參考引數。
            if (!IsValidSignature(postData, Request.Headers["X-Line-Signature"]))
                return Unauthorized();
#pragma warning restore CS8604 // 可能有 Null 參考引數。

            var receivedMessage = Utility.Parsing(postData);

            foreach (var ev in receivedMessage.events)
            {
                // 用戶加好友時，引導輸入 Email 綁定
                if (ev.type == "follow")
                {
                    var userId = ev.source.userId;
                    Utility.ReplyMessage(ev.replyToken,
                        "歡迎加入 CoWork！\n\n" +
                        "請傳送您的註冊 Email，即可完成綁定，\n" +
                        "預約成功後將透過此帳號收到確認通知。\n\n" +
                        $"您的 LINE User ID：\n{userId}",
                        _channelAccessToken);
                }

                // 用戶傳送文字訊息時
                if (ev.type == "message" && ev.message.type == "text")
                {
                    var lineUserId = ev.source.userId;
                    var text = ev.message.text?.Trim() ?? "";

                    // 判斷是否為 Email 格式
                    if (text.Contains("@") && text.Contains("."))
                    {
                        var user = await _context.Users
                            .FirstOrDefaultAsync(u => u.email == text);

                        if (user == null)
                        {
                            Utility.ReplyMessage(ev.replyToken,
                                "找不到此 Email 對應的帳號，\n請確認您輸入的 Email 與註冊時相同。",
                                _channelAccessToken);
                        }
                        else
                        {
                            user.line_id = lineUserId;
                            await _context.SaveChangesAsync();

                            Utility.ReplyMessage(ev.replyToken,
                                $"✅ 綁定成功！\n\n您好，{user.name}！\n" +
                                "日後預約成功將透過 LINE 發送確認通知給您。",
                                _channelAccessToken);
                        }
                    }
                    else
                    {
                        Utility.ReplyMessage(ev.replyToken,
                            "請傳送您的註冊 Email 完成綁定。\n\n" +
                            "例如：example@gmail.com\n\n" +
                            $"您的 LINE User ID：\n{lineUserId}",
                            _channelAccessToken);
                    }
                }
            }

            return Ok();
        }

        private bool IsValidSignature(string body, string signature)
        {
            if (string.IsNullOrEmpty(signature)) return false;

            var keyBytes = Encoding.UTF8.GetBytes(_channelSecret);
            var bodyBytes = Encoding.UTF8.GetBytes(body);

            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(bodyBytes);
            var expected = Convert.ToBase64String(hash);

            return expected == signature;
        }
    }
}
