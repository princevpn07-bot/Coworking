namespace CoworkingAPI.Dto
{
    /// <summary>
    /// ECPay 建立訂單請求
    /// </summary>
    public class CreatePaymentRequestDto
    {
        public int ContractId { get; set; }
        public int UserId { get; set; }
        public decimal TotalPrice { get; set; }
        public string Description { get; set; } = "辦公空間預訂";
    }

    /// <summary>
    /// ECPay 支付表單回應
    /// </summary>
    public class PaymentFormResponseDto
    {
        public string FormHtml { get; set; } = string.Empty;
    }

    /// <summary>
    /// ECPay 回調參數
    /// </summary>
    public class ECPayCallbackDto
    {
        public string MerchantID { get; set; } = string.Empty;
        public string MerchantTradeNo { get; set; } = string.Empty;
        public string RtnCode { get; set; } = string.Empty;
        public string RtnMsg { get; set; } = string.Empty;
        public string TradeNo { get; set; } = string.Empty;
        public int PaymentType { get; set; }
        public decimal TradeAmt { get; set; }
        public string PaymentDate { get; set; } = string.Empty;
        public string CheckMacValue { get; set; } = string.Empty;
    }

    /// <summary>
    /// 支付結果回應
    /// </summary>
    public class PaymentResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string OrderNo { get; set; } = string.Empty;
    }
}
