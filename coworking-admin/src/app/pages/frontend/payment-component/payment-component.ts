import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../services/profile';
import { SpaceDetailDto, SpaceDetailService } from '../../../services/space-detail.service';
import { CommonModule } from '@angular/common';

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
  imports: [FormsModule, CommonModule],
  templateUrl: './payment-component.html',
  styleUrl: './payment-component.css',
})
export class PaymentComponent implements OnInit {
  private readonly apiUrl = 'http://localhost:5193/api/Bookings/Add';

  // 從 space-detail 傳來的參數
  spaceId: number = 0;
  rentId: number = 0;
  startDate: string = '';
  endDate: string = '';
  totalPrice: number = 0;
  priceType: number = 1;

  // 空間資訊
  space: SpaceDetailDto | null = null;
  imgBaseUrl = 'http://localhost:5193/';
  spaceImage: string = '';

  // 使用者資訊（從 profile 帶入，只讀）
  userName = '';
  userPhone = '';
  userEmail = '';

  // 發票
  invoiceType = 'personal';
  companyName = '';
  taxId = '';

  submitting = false;

  priceTypeMap: Record<number, string> = {
    1: '每小時',
    2: '每日',
    3: '每月'
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private spaceDetailService: SpaceDetailService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.spaceId    = Number(params.get('spaceId'));
    this.rentId     = Number(params.get('rentId'));
    this.startDate  = params.get('startDate') ?? '';
    this.endDate    = params.get('endDate') ?? '';
    this.totalPrice = Number(params.get('totalPrice'));
    this.priceType  = Number(params.get('priceType')) || 1;

    if (!this.spaceId || !this.rentId || !this.startDate || !this.endDate) {
      alert('預約資訊不完整，請重新選擇');
      this.router.navigate(['/all-spaces']);
      return;
    }

    this.spaceDetailService.getSpaceDetail(this.spaceId).subscribe({
      next: (data) => {
        this.space = data;
        const firstImg = data.images?.[0]?.imagePath;
        this.spaceImage = firstImg ? this.imgBaseUrl + firstImg : 'assets/no-image.png';
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.profileService.getProfile().subscribe({
      next: (data: any) => {
        this.userName  = data.name  || '';
        this.userEmail = data.email || '';
        this.userPhone = data.phone || '';
        this.cdr.markForCheck();
      },
      error: (err) => console.error(err)
    });
  }

  get diffLabel(): string {
    if (!this.startDate || !this.endDate) return '';
    const s = new Date(this.startDate);
    const e = new Date(this.endDate);
    const pad = (n: number) => String(n).padStart(2, '0');

    if (this.priceType === 1) {
      const hours = Math.round((e.getTime() - s.getTime()) / 3600000);
      return `${s.getFullYear()}/${pad(s.getMonth()+1)}/${pad(s.getDate())} ${pad(s.getHours())}:00 ~ ${pad(e.getHours())}:00，共 ${hours} 小時`;
    }
    if (this.priceType === 2) {
      const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
      return `${s.getFullYear()}/${pad(s.getMonth()+1)}/${pad(s.getDate())} ~ ${e.getFullYear()}/${pad(e.getMonth()+1)}/${pad(e.getDate())}，共 ${days} 天`;
    }
    if (this.priceType === 3) {
      const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
      return `${s.getFullYear()}/${pad(s.getMonth()+1)} ~ ${e.getFullYear()}/${pad(e.getMonth()+1)}，共 ${months} 個月`;
    }
    return '';
  }

  onInvoiceTypeChange(event: Event): void {
    this.invoiceType = (event.target as HTMLSelectElement).value;
  }

  booking(): void {
    if (this.submitting) return;

    if (this.invoiceType === 'company' && (!this.companyName || !this.taxId)) {
      alert('請填寫公司名稱與統一編號');
      return;
    }

    if (!this.userName || !this.userPhone || !this.userEmail) {
      alert('您的個人資料未填寫完整，請先至會員中心完善資料');
      return;
    }

    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 1);

    const payload: AddBookingPayload = {
      user_id: this.auth.getUserId(),
      rent_id: this.rentId,
      employees_id: null,
      created_date: now.toISOString(),
      start_date: this.startDate,
      end_date: this.endDate,
      company_name: this.invoiceType === 'company' ? this.companyName : null,
      tax_id: this.invoiceType === 'company' ? this.taxId : null,
      status: 0,
      pay_deadline: deadline.toISOString(),
      cancelled_daedline: deadline.toISOString(),
      total_price: this.totalPrice,
    };

    this.submitting = true;
    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (booking) => {
        const contractId = booking?.contract_id;
        if (!contractId) {
          this.submitting = false;
          alert('取得訂單編號失敗，請稍後再試');
          return;
        }
        this.redirectToECPay(contractId);
      },
      error: (err) => {
        console.error(err);
        this.submitting = false;
        alert('預訂失敗，請稍後再試');
      },
    });
  }

  private redirectToECPay(contractId: number): void {
    const createPaymentUrl = 'http://localhost:5193/api/Payment/CreatePayment';
    this.http.post<any>(createPaymentUrl, {
      contractId,
      userId: this.auth.getUserId(),
      totalPrice: this.totalPrice,
      description: `CoWork 空間預約 - ${this.space?.spaceNumber ?? ''}`
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        const params: Record<string, string> = res.data;
        const paymentUrl: string = params['PaymentUrl'];

        // 動態建立表單並 POST 到綠界
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;

        Object.entries(params).forEach(([key, value]) => {
          if (key === 'PaymentUrl') return;
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      },
      error: (err) => {
        console.error(err);
        this.submitting = false;
        alert('建立支付失敗，請稍後再試');
      }
    });
  }
}
