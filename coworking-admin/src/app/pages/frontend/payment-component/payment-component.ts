import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, ChangeDetectorRef } from '@angular/core'; // 引入 ChangeDetectorRef
import { AuthService } from '../../../services/auth';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../services/profile';

export interface AddBookingPayload {
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
  imports: [FormsModule],
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
  userName = '';
  userPhone = '';
  userEmail = '';
  companyName = '';
  taxId = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef // 注入 ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (data: any) => {
        this.userName = data.name || '';
        this.userEmail = data.email || '';
        this.userPhone = data.phone || '';
        this.cdr.markForCheck(); // 手動標記元件需要檢查
      },
      error: (err) => {
        console.error('資料讀取失敗', err);
      },
    });
  }

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

    if (this.invoiceType === 'company') {
      if (!this.companyName || !this.taxId) {
        alert('公司名稱與統一編號為必填欄位');
        return;
      }
    }

    if (!this.userName || !this.userPhone || !this.userEmail) {
      alert('姓名、電話與電子郵件為必填欄位');
      return;
    }

    const rentIdValue =
      this.route.snapshot.queryParamMap.get('rent_id') ??
      this.route.snapshot.queryParamMap.get('rentId');
    const rentId = rentIdValue ? Number(rentIdValue) : null;
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 1);


// deadline 還需要重新計算
    const payload: AddBookingPayload = {
      user_id: this.auth.getUserId(),
      rent_id: rentId && Number.isFinite(rentId) ? rentId : null,
      employees_id: null,
      created_date: now.toISOString(),
      start_date: `${this.startDate}T00:00:00`,
      end_date: `${this.endDate}T23:59:59`,
      company_name: this.invoiceType === 'company' ? this.companyName : null,
      tax_id: this.invoiceType === 'company' ? this.taxId : null,
      status: 0,
      pay_deadline: deadline.toISOString(),
      cancelled_daedline: deadline.toISOString(),
      total_price: 1,
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
