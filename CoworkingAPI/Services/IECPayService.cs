namespace CoworkingAPI.Services
{
    public interface IECPayService
    {
        /// <summary>
        /// 建立 ECPay 支付參數 (JSON 格式供前端使用)
        /// </summary>
        Task<Dictionary<string, string>> CreatePaymentParametersAsync(int contractId, int userId, decimal totalPrice, string description = "辦公空間預訂");

        /// <summary>
        /// 驗證 ECPay 回調的 CheckMacValue
        /// </summary>
        bool VerifyCheckMacValue(Dictionary<string, string> parameters, string checkMacValue);

        /// <summary>
        /// 產生隨機訂單編號
        /// </summary>
        string GenerateMerchantTradeNo();
    }
}
