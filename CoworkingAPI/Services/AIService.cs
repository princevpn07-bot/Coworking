using OpenAI;
using OpenAI.Chat;
using System.ClientModel;

namespace CoworkingAPI.Services
{
    public record MessageDto(string Role, string Content);

    public interface IAIService
    {
        Task<string> GenerateAsync(string prompt, List<MessageDto>? history = null);
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

            如果用戶詢問特定時段是否有空位，請引導他們到「瀏覽空間」頁面查看即時資訊。
            如果問題與平台無關，請委婉說明你只能回答 CoWork 相關問題。
            """;

        public AIService(IConfiguration configuration)
        {
            var apiKey = configuration["AI:ApiKey"]
                ?? throw new InvalidOperationException("AI:ApiKey is not configured.");

            var options = new OpenAIClientOptions
            {
                Endpoint = new Uri("https://api.groq.com/openai/v1")
            };

            var openAIClient = new OpenAIClient(new ApiKeyCredential(apiKey), options);
            _client = openAIClient.GetChatClient("llama-3.3-70b-versatile");
        }

        public async Task<string> GenerateAsync(string prompt, List<MessageDto>? history = null)
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
            return response.Value.Content[0].Text ?? string.Empty;
        }
    }
}
