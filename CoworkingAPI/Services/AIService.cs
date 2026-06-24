using OpenAI;
using OpenAI.Chat;
using System.ClientModel;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CoworkingAPI.Services
{
    public record MessageDto(string Role, string Content);

    public class AIActionParams
    {
        public int? MinPrice { get; set; }
        public int? MaxPrice { get; set; }
        public int? Capacity { get; set; }
        public string? City { get; set; }
        public string? Keyword { get; set; }
    }

    public class AIAction
    {
        public string Type { get; set; } = string.Empty;
        public AIActionParams Params { get; set; } = new();
    }

    public class AIResult
    {
        public string Message { get; set; } = string.Empty;
        public AIAction? Action { get; set; }
    }

    public interface IAIService
    {
        Task<AIResult> GenerateAsync(string prompt, List<MessageDto>? history = null);
    }

    public class AIService : IAIService
    {
        private readonly ChatClient _client;

        private const string SystemPrompt = """
            你是「Covo」共享辦公空間平台的 AI 導覽助理。請用繁體中文回答，語氣親切友善，回答簡潔清楚。

            平台功能介紹：
            - 首頁：展示熱門共享空間與最新公告
            - 瀏覽空間：查看所有可用空間，可依地點、類型篩選
            - 空間詳情：查看空間照片、設備、價格與可預約時段
            - 預約流程：選擇空間 → 選擇時段 → 線上付款 → 完成預約
            - 我的訂單：查看歷史預約紀錄與訂單狀態

            空間類型說明：
            - 開放工位：彈性座位，適合短期使用
            - 獨立辦公室：私密空間，適合團隊或需要安靜的工作者
            - 會議室：可租借的會議空間，適合開會或簡報

            【ACTION 觸發規則】
            只有當用戶「明確表達想找空間、搜尋空間、要你推薦空間、或直接描述需求請你幫忙篩選」時，
            才在回覆的最後一行附上以下格式的 JSON（不要加 markdown，直接純文字）：
            ACTION:{"type":"filter_spaces","params":{}}

            ✅ 應觸發 ACTION 的範例：
            - 「我想找一個安靜的空間」
            - 「有沒有推薦的辦公室？」
            - 「幫我找台北的會議室，大概 10 人」
            - 「預算 5000 以內有什麼選擇？」
            - 「我需要一個有採光的地方工作」

            ❌ 不應觸發 ACTION 的範例：
            - 「你好」、「謝謝」、「掰掰」等打招呼
            - 「你是誰？」、「這平台怎麼用？」等功能詢問
            - 「預約流程是什麼？」、「怎麼付款？」等操作問題
            - 「我喜歡安靜的環境」（只是陳述喜好，沒有要求找空間）
            - 「你覺得台北怎麼樣？」（閒聊）

            判斷原則：用戶必須有「找/推薦/搜尋/幫我選」等主動尋找意圖，才觸發。
            若只是問平台問題、打招呼、或閒聊，一律不加 ACTION。

            觸發時的欄位說明（只在用戶明確提到時才加入，沒提到一律省略）：
            - minPrice：用戶提到最低預算時填入
            - maxPrice：用戶提到最高預算或每小時上限時填入（不可填預設值）
            - capacity：用戶提到人數時填入
            - city：用戶提到城市或地區時填入
            - keyword：從用戶描述的空間特質、氛圍、風格或用途中，提取最能代表需求的一個繁體中文詞。
              例如：「安靜」、「採光」、「會議」、「獨立」、「藝術」、「文創」、「自然」、「工業」
              若用戶沒有描述特質則省略 keyword。

            如果問題與平台無關，請委婉說明你只能回答 Covo 相關問題。
            """;

        public AIService(IConfiguration configuration)
        {
            var apiKey = configuration["AI:ApiKey"]
                ?? throw new InvalidOperationException("AI:ApiKey is not configured.");
            
            // todo: when apiKey is empty, need to process

            var options = new OpenAIClientOptions
            {
                Endpoint = new Uri("https://api.groq.com/openai/v1")
            };

            var openAIClient = new OpenAIClient(new ApiKeyCredential(apiKey), options);
            _client = openAIClient.GetChatClient("llama-3.3-70b-versatile");
        }

        public async Task<AIResult> GenerateAsync(string prompt, List<MessageDto>? history = null)
        {
            var messages = new List<ChatMessage>
            {
                ChatMessage.CreateSystemMessage(SystemPrompt)
            };

            if (history != null)
            {
                foreach (var msg in history)
                {
                    if (msg.Role == "user")
                        messages.Add(ChatMessage.CreateUserMessage(msg.Content));
                    else if (msg.Role == "assistant")
                        messages.Add(ChatMessage.CreateAssistantMessage(msg.Content));
                }
            }

            messages.Add(ChatMessage.CreateUserMessage(prompt));

            var response = await _client.CompleteChatAsync(messages);
            var rawText = response.Value.Content[0].Text ?? string.Empty;

            return ParseResult(rawText);
        }

        private static AIResult ParseResult(string rawText)
        {
            var match = Regex.Match(rawText, @"ACTION:(\{.*\})\s*$", RegexOptions.Multiline);
            if (!match.Success)
                return new AIResult { Message = rawText.Trim() };

            var cleanMessage = rawText[..match.Index].Trim();
            try
            {
                var action = JsonSerializer.Deserialize<AIAction>(match.Groups[1].Value,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return new AIResult { Message = cleanMessage, Action = action };
            }
            catch
            {
                return new AIResult { Message = cleanMessage };
            }
        }
    }
}
