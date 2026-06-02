using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace CoworkingAPI.Services
{
    public class ECPayService : IECPayService
    {
        private readonly IConfiguration _configuration;
        private readonly string _merchantID;
        private readonly string _hashKey;
        private readonly string _hashIV;
        private readonly ILogger<ECPayService> _logger;

        public ECPayService(IConfiguration configuration, ILogger<ECPayService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _merchantID = configuration["ECPay:MerchantID"] ?? throw new InvalidOperationException("ECPay MerchantID not configured");
            _hashKey = configuration["ECPay:HashKey"] ?? throw new InvalidOperationException("ECPay HashKey not configured");
            _hashIV = configuration["ECPay:HashIV"] ?? throw new InvalidOperationException("ECPay HashIV not configured");
        }

        /// <summary>
        /// 建立 ECPay 支付參數 (JSON 格式供前端使用)
        /// </summary>
        public async Task<Dictionary<string, string>> CreatePaymentParametersAsync(int contractId, int userId, decimal totalPrice, string description = "辦公空間預訂")
        {
            try
            {
                // 確保金額為整數（ECPay 只接受整數金額）
                int amount = (int)Math.Round(totalPrice);

                var parameters = new Dictionary<string, string>
                {
                    { "MerchantID", _merchantID },
                    { "MerchantTradeNo", GenerateMerchantTradeNo() },
                    { "MerchantTradeDate", DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss") },
                    { "PaymentType", "aio" },
                    { "TotalAmount", amount.ToString() },
                    { "TradeDesc", description },
                    { "ItemName", description },
                    { "ReturnURL", _configuration["ECPay:ReturnUrl"] ?? "http://localhost:5000/api/payment/return" },
                    { "ChoosePayment", "ALL" },
                    { "ClientBackURL", _configuration["ECPay:ClientBackUrl"] ?? "" },
                    { "OrderResultURL", "" },
                    { "EncryptType", "1" },
                    { "Remark", $"ContractId:{contractId},UserId:{userId}" }
                };

                // 產生 CheckMacValue
                parameters["CheckMacValue"] = GenerateCheckMacValue(parameters);

                _logger.LogInformation($"ECPay payment parameters generated for Contract ID: {contractId}, Amount: {amount}, TradeNo: {parameters["MerchantTradeNo"]}");

                var result = new Dictionary<string, string>(parameters)
                {
                    { "PaymentUrl", _configuration["ECPay:PaymentUrl"] ?? "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5" }
                };

                return await Task.FromResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating ECPay payment parameters: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// 驗證 ECPay 回調的 CheckMacValue
        /// </summary>
        public bool VerifyCheckMacValue(Dictionary<string, string> parameters, string checkMacValue)
        {
            try
            {
                // 建立驗證用的參數字典（排除 CheckMacValue 本身）
                var verifyParams = parameters
                    .Where(x => !x.Key.Equals("CheckMacValue", StringComparison.OrdinalIgnoreCase))
                    .OrderBy(x => x.Key)
                    .ToDictionary(x => x.Key, x => x.Value);

                string calculatedMacValue = GenerateCheckMacValue(verifyParams);

                bool isValid = calculatedMacValue.Equals(checkMacValue, StringComparison.OrdinalIgnoreCase);

                if (isValid)
                {
                    _logger.LogInformation($"ECPay CheckMacValue verification succeeded");
                }
                else
                {
                    _logger.LogWarning($"ECPay CheckMacValue verification failed. Expected: {calculatedMacValue}, Got: {checkMacValue}");
                }

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying ECPay CheckMacValue: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// 產生 CheckMacValue (ECPay 簽名)
        /// </summary>
        private string GenerateCheckMacValue(Dictionary<string, string> parameters)
        {
            // 1. 按照字典序排序參數
            var sortedParams = parameters
                .OrderBy(x => x.Key)
                .ToList();

            // 2. 組合參數字串 (key1=value1&key2=value2&...)
            var parameterString = string.Join("&", sortedParams.Select(x => $"{x.Key}={x.Value}"));

            // 3. 在前後加上 HashKey 和 HashIV
            var rawString = $"HashKey={_hashKey}&{parameterString}&HashIV={_hashIV}";

            // 4. URL encode 整個字串，並依 ECPay 規則轉為小寫
            var urlEncoded = HttpUtility.UrlEncode(rawString, Encoding.UTF8)
                .ToLowerInvariant()
                .Replace("%2d", "-")
                .Replace("%5f", "_")
                .Replace("%2e", ".")
                .Replace("%21", "!")
                .Replace("%2a", "*")
                .Replace("%28", "(")
                .Replace("%29", ")")
                .Replace("%20", "+");

            // 5. 使用 SHA256 加密
            using (var sha256 = SHA256.Create())
            {
                byte[] hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(urlEncoded));
                string hashValue = BitConverter.ToString(hashedBytes).Replace("-", "").ToUpper();
                return hashValue;
            }
        }

        /// <summary>
        /// 產生隨機訂單編號
        /// </summary>
        public string GenerateMerchantTradeNo()
        {
            // 格式: CW + 年月日時分秒 + 4位隨機數
            var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            var random = new Random();
            var randomSuffix = random.Next(1000, 9999);
            return $"CW{timestamp}{randomSuffix}";
        }
    }
}
