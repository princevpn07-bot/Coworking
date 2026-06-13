using Microsoft.AspNetCore.Mvc;
using CoworkingAPI.Dto;
using CoworkingAPI.Services;
using CoworkingAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace CoworkingAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IECPayService _ecPayService;
        private readonly AppDbContext _context;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IECPayService ecPayService, AppDbContext context, ILogger<PaymentController> logger)
        {
            _ecPayService = ecPayService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 建立支付參數 (返回 JSON，前端自行構建表單)
        /// </summary>
        [HttpPost("CreatePayment")]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequestDto request)
        {
            try
            {
                if (request.TotalPrice <= 0)
                {
                    return BadRequest(new { success = false, message = "金額必須大於 0" });
                }

                // 驗證預約是否存在
                var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.contract_id == request.ContractId);
                if (booking == null)
                {
                    return NotFound(new { success = false, message = $"找不到合約 ID: {request.ContractId}" });
                }

                // 驗證使用者是否匹配
                if (booking.user_id != request.UserId)
                {
                    return Unauthorized(new { success = false, message = "使用者與預約不匹配" });
                }

                // 建立支付參數
                var paymentParams = await _ecPayService.CreatePaymentParametersAsync(
                    request.ContractId,
                    request.UserId,
                    request.TotalPrice,
                    request.Description
                );

                _logger.LogInformation($"Payment parameters created for Contract: {request.ContractId}, Amount: {request.TotalPrice}");

                // 返回 JSON 格式的支付參數 (前端負責構建表單並提交)
                return Ok(new
                {
                    success = true,
                    message = "支付參數已生成，請使用前端提交表單",
                    data = paymentParams
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating payment: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"建立支付失敗: {ex.Message}" });
            }
        }

        /// <summary>
        /// ECPay 回調端點 (ReturnURL)
        /// </summary>
        [HttpPost("Return")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Return()
        {
            try
            {
                _logger.LogInformation("ECPay callback received");

                // 從 Form 取得所有參數
                var parameters = new Dictionary<string, string>();
                foreach (var key in Request.Form.Keys)
                {
                    parameters[key] = Request.Form[key].ToString();
                }

                // 取得 CheckMacValue
                var checkMacValue = parameters.ContainsKey("CheckMacValue") ? parameters["CheckMacValue"] : string.Empty;

                // 驗證簽名
                if (!_ecPayService.VerifyCheckMacValue(parameters, checkMacValue))
                {
                    _logger.LogWarning("Invalid CheckMacValue");
                    return Content("1|Error");
                }

                var rtnCode = parameters.ContainsKey("RtnCode") ? parameters["RtnCode"] : "0";
                var rtnMsg = parameters.ContainsKey("RtnMsg") ? parameters["RtnMsg"] : "Unknown";

                // 支付成功 (RtnCode = 1)
                if (rtnCode == "1")
                {
                    var merchantTradeNo = parameters.ContainsKey("MerchantTradeNo") ? parameters["MerchantTradeNo"] : "";
                    var tradeNo = parameters.ContainsKey("TradeNo") ? parameters["TradeNo"] : "";
                    var tradeAmt = parameters.ContainsKey("TradeAmt") ? parameters["TradeAmt"] : "0";

                    _logger.LogInformation($"Payment successful - MerchantTradeNo: {merchantTradeNo}, TradeNo: {tradeNo}, Amount: {tradeAmt}");

                    // 更新訂單狀態為已付款 (status = 1)
                    int contractId = parameters.ContainsKey("CustomField1") ? int.Parse(parameters["CustomField1"]) : 0;
                    var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.contract_id == contractId);
                    if (booking != null)
                    {
                        booking.status = 1;
                        _context.Bookings.Update(booking);

                        var rent = await _context.Rents.FirstOrDefaultAsync(r => r.rent_id == booking.rent_id);
                        if (rent != null)
                        {
                            var space = await _context.Spaces.FirstOrDefaultAsync(s => s.space_id == rent.space_id);
                            if (space != null)
                            {
                                space.status = 1;
                                _context.Spaces.Update(space);
                            }
                        }

                        await _context.SaveChangesAsync();
                    }
                    return Content("1|OK");
                }
                else
                {
                    _logger.LogWarning($"Payment failed - RtnCode: {rtnCode}, RtnMsg: {rtnMsg}");
                    return Content("1|Error");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error processing ECPay callback: {ex.Message}");
                return Content("0|Error");
            }
        }

        /// <summary>
        /// 測試端點：模擬成功支付回調
        /// </summary>
        [HttpPost("TestPaymentSuccess")]
        public async Task<IActionResult> TestPaymentSuccess([FromBody] CreatePaymentRequestDto request)
        {
            try
            {
                var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.contract_id == request.ContractId);
                if (booking == null)
                {
                    return NotFound(new { success = false, message = $"找不到合約 ID: {request.ContractId}" });
                }

                // 更新預約狀態為已付款 (status = 1 表示已付款)
                booking.status = 1;
                _context.Bookings.Update(booking);

                var rent = await _context.Rents.FirstOrDefaultAsync(r => r.rent_id == booking.rent_id);
                if (rent != null)
                {
                    var space = await _context.Spaces.FirstOrDefaultAsync(s => s.space_id == rent.space_id);
                    if (space != null)
                    {
                        space.status = 1;
                        _context.Spaces.Update(space);
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Test payment success - Contract ID: {request.ContractId}");

                return Ok(new
                {
                    success = true,
                    message = "測試支付成功",
                    redirectUrl = $"http://localhost:4200/booking-success?orderId={request.ContractId}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in test payment: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"測試支付失敗: {ex.Message}" });
            }
        }

        /// <summary>
        /// 查詢支付狀態
        /// </summary>
        [HttpGet("Status/{contractId}")]
        public async Task<IActionResult> GetPaymentStatus(int contractId)
        {
            try
            {
                var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.contract_id == contractId);
                if (booking == null)
                {
                    return NotFound(new { success = false, message = $"找不到合約 ID: {contractId}" });
                }

                return Ok(new
                {
                    success = true,
                    contractId = booking.contract_id,
                    status = booking.status,
                    totalPrice = booking.total_price,
                    createdDate = booking.created_date,
                    payDeadline = booking.pay_deadline
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting payment status: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"查詢失敗: {ex.Message}" });
            }
        }
    }
}
