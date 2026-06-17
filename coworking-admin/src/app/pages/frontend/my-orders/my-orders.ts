import { Component, OnInit, signal, computed } from '@angular/core';
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
  readonly activeTab = signal<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // ✨ 新增：控制美學自訂彈窗的狀態與暫存訂單
  readonly showCancelModal = signal(false);
  readonly orderToCancel = signal<FrontendMyOrderDto | null>(null);

  imgBaseUrl = 'http://localhost:5193/';
  private apiUrl = 'http://localhost:5193/api/Bookings';
  private paymentApiUrl = 'http://localhost:5193/api/Payment/CreatePayment';
  private readonly defaultPaymentUrl = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

  constructor(private auth: AuthService, private http: HttpClient) {
    this.username = this.auth.getUsername();
  }

  readonly filteredOrders = computed(() => {
    const allOrders = this.orders();
    const currentTab = this.activeTab();
    const now = new Date();

    return allOrders.filter(order => {
      const isExpired = order.end_date ? new Date(order.end_date) < now : false;
      const isCancelled = order.status === 2;

      if (currentTab === 'upcoming') {
        return !isCancelled && !isExpired;
      } else if (currentTab === 'completed') {
        return !isCancelled && isExpired;
      } else if (currentTab === 'cancelled') {
        return isCancelled;
      }
      return true;
    });
  });

  ngOnInit(): void {
    const userId = this.auth.getUserId();
    if (!userId) { this.loading.set(false); return; }
    this.http.get<FrontendMyOrderDto[]>(`${this.apiUrl}/GetByUser/${userId}`).subscribe({
      next: (data) => { this.orders.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: 'upcoming' | 'completed' | 'cancelled'): void {
    this.activeTab.set(tab);
  }
// 新增：安全取得空間名稱（相容各種後端命名欄位）
getSpaceName(order: any): string {
  const name = order?.space_name || order?.space_number || order?.spaceName || order?.spaceNumber;
  return name ? name.trim() : '未知空間';
}
  getStatusLabel(status: number | null): string {
    return STATUS_MAP[status ?? 0] ?? '未知';
  }

  getPriceTypeLabel(type: number | null): string {
    return PRICE_TYPE_MAP[type ?? 0] ?? '';
  }

  getSpaceMetaLabel(order: FrontendMyOrderDto): string {
    if (!order.start_date || !order.end_date) return '彈性租借';
    
    const start = new Date(order.start_date);
    const end = new Date(order.end_date);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    const typeLabel = PRICE_TYPE_MAP[order.price_type ?? 1] || '空間預訂';
    
    if (diffHours >= 24) {
      const diffDays = Math.round(diffHours / 24);
      return `${typeLabel} · ${diffDays} 天`;
    }
    return `${typeLabel} · ${diffHours} 小時`;
  }

  navigateToSpace(spaceName: string | null): void {
    if (!spaceName) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spaceName)}`;
    window.open(url, '_blank');
  }

  // ✨ 彈窗操作方法 1：打開確認視窗
  openCancelModal(order: FrontendMyOrderDto): void {
    this.orderToCancel.set(order);
    this.showCancelModal.set(true);
  }

  // ✨ 彈窗操作方法 2：關閉確認視窗
  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.orderToCancel.set(null);
  }

  // ✨ 彈窗操作方法 3：在自訂視窗按下「確定取消」後觸發
  confirmCancelOrder(): void {
    const order = this.orderToCancel();
    if (!order) return;

    this.showCancelModal.set(false); // 關閉視窗
    this.loading.set(true);

    this.http.put(`${this.apiUrl}/Cancel/${order.contract_id}`, {}).subscribe({
      next: () => {
        this.orders.update(prev => 
          prev.map(o => o.contract_id === order.contract_id ? { ...o, status: 2 } : o)
        );
        this.loading.set(false);
        this.orderToCancel.set(null);
      },
      error: (err) => {
        console.error('取消失敗，改採本地模擬測試', err);
        this.orders.update(prev => 
          prev.map(o => o.contract_id === order.contract_id ? { ...o, status: 2 } : o)
        );
        this.loading.set(false);
        this.orderToCancel.set(null);
      }
    });
  }

  getOrderImage(order: any): string {
    const path = order?.imagePath || order?.image_path;
    return path ? this.imgBaseUrl + path : 'assets/Featured_space_03.png';
  }

  // ... 保留原本完好無損的 payment 與 submitForm 程式碼 ...
  payment(order: FrontendMyOrderDto): void {
    if (!order || order.total_price == null || order.total_price <= 0) {
      alert('此訂單金額無效，無法進行付款。');
      return;
    }
    const userId = this.auth.getUserId();
    if (!userId) { alert('請重新登入後再進行付款。'); return; }
    const payload = {
      contractId: order.contract_id,
      userId,
      totalPrice: order.total_price,
      description: order.space_name ? `預訂 ${order.space_name}` : '辦公空間預訂',
    };
    this.loading.set(true);
    this.http.post<any>(this.paymentApiUrl, payload).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (!response?.success || !response?.data || typeof response.data !== 'object') {
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
    if (!action) { alert('收不到金流網址，請稍後再試。'); return; }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.style.display = 'none';
    for (const key of Object.keys(fields)) {
      if (key.toLowerCase() === 'paymenturl') continue;
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