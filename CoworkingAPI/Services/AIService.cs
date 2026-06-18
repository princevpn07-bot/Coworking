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
            你是「CoWork」共享辦公空間平台的 AI 導覽助理。請用繁體中文回答，語氣親切友善，回答簡潔清楚。

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

            【重要規則】
            當用戶的訊息涉及「找空間、推薦空間、預算、人數、地點、空間風格、氛圍、用途、特色」等任何與選擇或搜尋空間相關的需求時，
            請在回覆的最後一行附上以下格式的 JSON（不要加 markdown，直接純文字）：
            ACTION:{"type":"filter_spaces","params":{}}

            欄位說明（所有欄位只在用戶明確提到時才加入，沒提到就完全省略該欄位）：
            - minPrice：用戶提到最低預算時填入，否則省略
            - maxPrice：用戶提到最高預算或每小時上限時填入，否則省略（不可填預設值）
            - capacity：用戶提到人數時填入，否則省略
            - city：用戶提到城市或地區時填入，否則省略
            - keyword：從用戶描述的「空間特質、氛圍、風格或用途」中，提取最能代表其需求的一個中文詞。
              這個詞會直接用來比對資料庫中的空間介紹，請用用戶說的原始詞彙，不要換成同義詞。
              例如：
              - 用戶說「安靜的地方」→ keyword 填「安靜」
              - 用戶說「有採光/明亮」→ keyword 填「採光」
              - 用戶說「適合開會」→ keyword 填「會議」
              - 用戶說「有隔間/隱私」→ keyword 填「獨立」
              - 用戶說「藝術感/藝術氣息/藝術風/藝術」→ keyword 填「藝術」
              - 用戶說「文創/創意/設計感」→ keyword 填「文創」
              - 用戶說「自然/綠意/植栽」→ keyword 填「自然」
              - 用戶說「工業風/Loft」→ keyword 填「工業」
              若用戶沒有描述特質則省略 keyword。
            只在真的需要引導用戶篩選空間時才加 ACTION，一般問答不需要加。

            如果問題與平台無關，請委婉說明你只能回答 CoWork 相關問題。
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
