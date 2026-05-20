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
}
