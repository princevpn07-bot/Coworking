using CoworkingAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;

        public AIController(IAIService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] AskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Prompt))
                return BadRequest("Prompt is required.");

            var result = await _aiService.GenerateAsync(request.Prompt, request.History);
            return Ok(new { reply = result });
        }
    }

    public record AskRequest(string Prompt, List<MessageDto>? History);
}
