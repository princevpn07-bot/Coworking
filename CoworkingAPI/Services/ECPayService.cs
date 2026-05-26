using System.Security.Cryptography;
using System.Text;

namespace CoworkingAPI.Services
{
    public class ECPayService : IECPayService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ECPayService> _logger;

        private string MerchantID => _configuration["ECPay:MerchantID"] ?? throw new InvalidOperationException("ECPay MerchantID not configured");
        private string HashKey => _configuration["ECPay:HashKey"] ?? throw new InvalidOperationException("ECPay HashKey not configured");
        private string HashIV => _configuration["ECPay:HashIV"] ?? throw new InvalidOperationException("ECPay HashIV not configured");
        private string PaymentUrl => _configuration["ECPay:PaymentUrl"] ?? throw new InvalidOperationException("ECPay PaymentUrl not configured");
        private string ReturnUrl => _configuration["ECPay:ReturnUrl"] ?? throw new InvalidOperationException("ECPay ReturnUrl not configured");
        private string ClientBackUrl => _configuration["ECPay:ClientBackUrl"] ?? throw new InvalidOperationException("ECPay ClientBackUrl not configured");

        public ECPayService(IConfiguration configuration, ILogger<ECPayService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// 建立 ECPay 支付參數 (JSON 格式)
        /// </summary>
        public async Task<Dictionary<string, string>> CreatePaymentParametersAsync(int contractId, int userId, decimal totalPrice, string description = "辦公空間預訂")
        {
            try
            {
                var merchantTradeNo = GenerateMerchantTradeNo();
                var tradeDate = DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss");

                // 建立參數字典
                var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    { "MerchantID", MerchantID },
                    { "MerchantTradeNo", merchantTradeNo },
                    { "MerchantTradeDate", tradeDate },
                    { "PaymentType", "aio" },
                    { "TotalAmount", ((int)totalPrice).ToString() },
                    { "TradeDesc", description },
                    { "ItemName", $"辦公空間預訂 (合約ID: {contractId})" },
                    { "ReturnURL", ReturnUrl },
                    { "ClientBackURL", ClientBackUrl },
                    { "ChoosePayment", "ALL" },
                    { "EncryptType", "1" }, // 1 = SHA256
                    { "OrderResultURL", ClientBackUrl }
                };

                // 產生 CheckMacValue
                var checkMacValue = GenerateCheckMacValue(parameters);
                parameters.Add("CheckMacValue", checkMacValue);

                // 返回支付參數 (前端使用)
                var resultDict = new Dictionary<string, string>(parameters)
                {
                    { "PaymentUrl", PaymentUrl }
                };

                _logger.LogInformation($"ECPay payment parameters generated for Contract ID: {contractId}, Amount: {totalPrice}, TradeNo: {merchantTradeNo}");

                return await Task.FromResult(resultDict);
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
                // 移除 CheckMacValue 用來驗證
                var sortedParams = new SortedDictionary<string, string>(parameters, StringComparer.Ordinal);
                sortedParams.Remove("CheckMacValue");

                var generatedCheckMac = GenerateCheckMacValue(sortedParams);
                var result = generatedCheckMac.Equals(checkMacValue, StringComparison.OrdinalIgnoreCase);

                if (!result)
                {
                    _logger.LogWarning($"CheckMacValue verification failed. Expected: {generatedCheckMac}, Got: {checkMacValue}");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying CheckMacValue: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// 產生隨機訂單編號
        /// </summary>
        public string GenerateMerchantTradeNo()
        {
            // 格式: CW + 時間戳 + 隨機數
            var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            var random = new Random().Next(1000, 9999);
            return $"CW{timestamp}{random}";
        }

        /// <summary>
        /// 產生 CheckMacValue
        /// </summary>
        private string GenerateCheckMacValue(SortedDictionary<string, string> parameters)
        {
            // 建立查詢字串
            var queryString = string.Join("&", parameters.Select(p => $"{p.Key}={p.Value}"));
            var encryptString = $"HashKey={HashKey}&{queryString}&HashIV={HashIV}";

            // SHA256 加密
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(encryptString));
                var checkMacValue = BitConverter.ToString(hashedBytes).Replace("-", "").ToUpper();
                return checkMacValue;
            }
        }

            }
        }
