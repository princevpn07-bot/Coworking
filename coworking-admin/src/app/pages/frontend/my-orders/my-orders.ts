import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import { FrontendMyOrderDto } from '../../../models/user.model';

const STATUS_MAP: Record<number, string> = {
  0: '待確認',
  1: '已確認',
  2: '已取消',
  3: '已完成',
};

const PRICE_TYPE_MAP: Record<number, string> = {
  1: '時租',
  2: '日租',
  3: '月租',
};

@Component({
  selector: 'app-my-orders',
  imports: [RouterLink, CommonModule],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders implements OnInit {
  username: string;
  readonly orders = signal<FrontendMyOrderDto[]>([]);
  readonly loading = signal(true);

  private apiUrl = 'http://localhost:5193/api/Bookings';
  private paymentApiUrl = 'http://localhost:5193/api/Payment/CreatePayment';
  private readonly defaultPaymentUrl = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

  constructor(private auth: AuthService, private http: HttpClient) {
    this.username = this.auth.getUsername();
  }

  ngOnInit(): void {
    const userId = this.auth.getUserId();
    if (!userId) { this.loading.set(false); return; }
    this.http.get<FrontendMyOrderDto[]>(`${this.apiUrl}/GetByUser/${userId}`).subscribe({
      next: (data) => { this.orders.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getStatusLabel(status: number | null): string {
    return STATUS_MAP[status ?? 0] ?? '未知';
  }

  getPriceTypeLabel(type: number | null): string {
    return PRICE_TYPE_MAP[type ?? 0] ?? '';
  }

  payment(order: FrontendMyOrderDto): void {
    if (!order || order.total_price == null || order.total_price <= 0) {
      alert('此訂單金額無效，無法進行付款。');
      return;
    }

    const userId = this.auth.getUserId();
    if (!userId) {
      alert('請重新登入後再進行付款。');
      return;
    }

    const payload = {
      contractId: order.contract_id,
      userId,
      totalPrice: order.total_price,
      description: order.space_name ? `預訂 ${order.space_name}` : '辦公空間預訂',
    };

    this.loading.set(true);
    this.http.post<any>(this.paymentApiUrl, payload)
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          console.log('CreatePayment response:', response);

          if (!response?.success || !response?.data || typeof response.data !== 'object') {
            console.error('CreatePayment response invalid', response);
            alert(response?.message || '建立支付參數失敗，請稍後再試。');
            return;
          }

          const fields = response.data as Record<string, string>;
          this.submitForm(fields);
        },
        error: (err) => {
          console.error('CreatePayment failed', err);
          this.loading.set(false);
          alert('無法建立付款連線，請稍後再試。');
        }
      });
  }

  private submitForm(fields: Record<string, string>): void {
    const action = this.defaultPaymentUrl;
    if (!action) {
      console.error('Missing payment URL in fields', fields);
      alert('收不到金流網址，請稍後再試。');
      return;
    }

    if (!fields['PaymentUrl'] && !fields['paymentUrl'] && !fields['paymenturl']) {
      console.warn('PaymentUrl is missing from backend response, using default stage URL.', fields);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.style.display = 'none';

    for (const key of Object.keys(fields)) {
      if (key.toLowerCase() === 'paymenturl') {
        continue;
      }
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }
}

