import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

interface AddBookingPayload {
  user_id: number | null;
  rent_id: number | null;
  employees_id: number | null;
  created_date: string;
  start_date: string;
  end_date: string;
  company_name: string | null;
  tax_id: string | null;
  status: number;
  pay_deadline: string;
  cancelled_daedline: string;
  total_price: number;
}

@Component({
  selector: 'app-payment-component',
  imports: [],
  templateUrl: './payment-component.html',
  styleUrl: './payment-component.css',
})
export class PaymentComponent {
  private readonly apiUrl = 'http://localhost:5193/api/Bookings/Add';

  today: string = new Date().toISOString().split('T')[0];
  startDate = '';
  endDate = '';
  invoiceType = 'personal';
  submitting = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  onStartDateChange(event: Event): void {
    this.startDate = (event.target as HTMLInputElement).value;
  }

  onEndDateChange(event: Event): void {
    this.endDate = (event.target as HTMLInputElement).value;
  }

  onInvoiceTypeChange(event: Event): void {
    this.invoiceType = (event.target as HTMLSelectElement).value;
  }

  booking(): void {
    if (this.submitting) return;

    if (!this.startDate || !this.endDate) {
      alert('請選擇開始日期與結束日期');
      return;
    }

    const startDate = new Date(`${this.startDate}T00:00:00`);
    const endDate = new Date(`${this.endDate}T23:59:59`);

    if (endDate <= startDate) {
      alert('結束日期必須晚於開始日期');
      return;
    }

    const rentIdValue =
      this.route.snapshot.queryParamMap.get('rent_id') ??
      this.route.snapshot.queryParamMap.get('rentId');
    const rentId = rentIdValue ? Number(rentIdValue) : null;
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 1);

    const payload: AddBookingPayload = {
      user_id: this.auth.getUserId(),
      rent_id: rentId && Number.isFinite(rentId) ? rentId : null,
      employees_id: null,
      created_date: now.toISOString(),
      start_date: `${this.startDate}T00:00:00`,
      end_date: `${this.endDate}T23:59:59`,
      company_name: null,
      tax_id: null,
      status: 0,
      pay_deadline: deadline.toISOString(),
      cancelled_daedline: deadline.toISOString(),
      total_price: 17925,
    };

    this.submitting = true;
    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.submitting = false;
        alert('預訂成功');
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        console.error('新增預訂失敗', err);
        this.submitting = false;
        alert('預訂失敗，請確認後端 API 是否啟動或資料是否正確');
      },
    });

  }
}
