import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, ChangeDetectorRef, Pipe, PipeTransform} from '@angular/core'; // 引入 ChangeDetectorRef
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

@Pipe({ name: 'hourLabel', standalone: true})
export class HourLabelPipe implements PipeTransform {
  transform(hour: number): string {
    return hour.toString().padStart(2, '0') + ':00';
  }
}

@Component({
  selector: 'app-payment-component',
  imports: [FormsModule, HourLabelPipe, CommonModule],
  templateUrl: './payment-component.html',
  styleUrl: './payment-component.css',
})
export class PaymentComponent {
  private readonly apiUrl = 'http://localhost:5193/api/Bookings/Add';

  today: string = new Date().toISOString().split('T')[0];
  curMonth: string = new Date().toISOString().slice(0, 7);
  hourOptions = Array.from({ length: 11 }, (_, i) => i + 8); // 8~21點
  dateMode = 'hour';
  tempStartDate = '';
  startHour = '';
  endHour = '';
  startDate = '';
  endDate = '';
  invoiceType = 'personal';
  submitting = false;
  userName = '';
  userPhone = '';
  userEmail = '';
  companyName = '';
  taxId = '';
  hourError = false;
  perPrice: number = 0;
  space: SpaceDetailDto | null = null;

  priceTypeMap: Record<string, string> = {
    '1': '每小時',
    '2': '每日',
    '3': '每月'
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private spaceDetailService: SpaceDetailService,
    private cdr: ChangeDetectorRef // 注入 ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    const space_id = this.route.snapshot.queryParamMap.get('spaceId') ?? null;
    if (space_id == null) {
      console.log("[error] [payment-component.ts] space_id is null")
      alert("獲取空間編號失敗")
      return;
    }
    this.spaceDetailService.getSpaceDetail(Number(space_id)).subscribe({
      next: (data) => {
        this.space = data;
        this.cdr.detectChanges(); // 手動觸發檢查
      },
      error: (err) => {
        console.error(err);
        this.cdr.detectChanges(); // 手動觸發檢查
      }
    });

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

  onModeChange(): void {
    this.startDate = '';
    this.endDate = '';
    this.tempStartDate = '';
    this.startHour = '';
    this.endHour = '';
    this.hourError = false;

    if (this.dateMode === 'hour') {this.perPrice = this.space?.rents?.[0]?.price ?? 0;}
    if (this.dateMode === 'day') {this.perPrice = this.space?.rents?.[1]?.price ?? 0;}
    if (this.dateMode === 'month') {this.perPrice = this.space?.rents?.[2]?.price ?? 0;}
    // console.log(this.dateMode);
  }

  get diff(): number {
    if (!this.startDate || !this.endDate) {
      return 0;
    }
    if (this.dateMode === 'hour') {
      const hour = Number(this.endHour) - Number(this.startHour);
      return Number.isFinite(hour) ? hour : 0;
    }
    if (this.dateMode === 'day') {
      const days = Math.round((new Date(this.endDate).getTime() - new Date(this.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return Number.isFinite(days) ? days : 0;
    }
    if (this.dateMode === 'month') {
      const months = (new Date(this.endDate).getFullYear() - new Date(this.startDate).getFullYear()) * 12 + (new Date(this.endDate).getMonth() - new Date(this.startDate).getMonth()) + 1;
      return Number.isFinite(months) ? months : 0;
    }
    return 0;
  }

  get totalPrice(): number {
    const price = this.diff * this.perPrice;
    return Number.isFinite(price) ? price : 0;
  }

  get Diff(): string {
    if (!this.startDate || !this.endDate) {
      return '';
    }

    const d = this.diff;

    if (this.dateMode === 'hour') {
      return `${this.tempStartDate} ${this.startHour}:00 ~ ${this.endHour}:00，共 ${d} 小時`;
    }
    if (this.dateMode === 'day') {
      return `${this.startDate} ~ ${this.endDate}，共 ${d} 天`;
    }
    if (this.dateMode === 'month') {
      return `${this.startDate} ~ ${this.endDate}，共 ${d} 個月`;
    }
    return '';
  }

  theLastDay(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month), 0);

    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    //console.log('最後一天:', `${y}-${m}-${d}`);
    return `${y}-${m}-${d}`;
  }

  onStartHourChange(event: Event): void {
    if (this.tempStartDate === '' || this.tempStartDate === null) {
      alert('請先選擇開始日期');
      setTimeout(() => {this.startHour = '';});
      return;
    }
    this.startDate = `${this.tempStartDate}T${this.startHour}:00:00`;

    this.endHour = '';
    this.endDate = '';
    this.hourError = false;
    //console.log('開始日期與時間:', this.startDate);
  }

  onEndHourChange(event: Event): void {
    if (this.tempStartDate === '' || this.tempStartDate === null) {
      alert('請先選擇開始日期');
      setTimeout(() => {this.endHour = '';});
      return;
    }
    if (this.startHour === '' || this.startHour === null) {
      alert('請先選擇開始時間');
      setTimeout(() => {this.endHour = '';});
      return;
    }

    if (Number(this.endHour) <= Number(this.startHour)) {
      this.hourError = true;
      alert('結束時間必須晚於開始時間');
      setTimeout(() => {this.endHour = '';});
      return;
    }
    this.endDate = `${this.tempStartDate}T${this.endHour}:00:00`;
    this.hourError = false;
    //console.log('結束日期與時間:', this.endDate);
  }


  onStartDateChange(event: Event): void {
    if (this.dateMode === 'hour') {
      this.startHour = '';
      this.endHour = '';
      this.tempStartDate = (event.target as HTMLInputElement).value;
      return;
    }
    this.endDate = '';
    this.startDate = (event.target as HTMLInputElement).value;
    // console.log('開始日期:', this.startDate);
  }

  onEndDateChange(event: Event): void {
    if (this.startDate === '' || this.startDate === null) {
      alert('請先選擇開始日期');
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.endDate = (event.target as HTMLInputElement).value;
    //console.log('結束日期:', this.endDate);
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

    if (this.endDate <= this.startDate) {
      alert('結束日期必須晚於開始日期');
      return;
    }

    if (this.dateMode === 'day') {
      this.startDate = `${this.startDate}T${this.hourOptions[0]}:00:00`;
      this.endDate = `${this.endDate}T${this.hourOptions[this.hourOptions.length - 1]}:00:00`;
    }
    if (this.dateMode === 'month') {
      this.startDate = `${this.startDate}-01T${this.hourOptions[0]}:00:00`;
      this.endDate = `${this.theLastDay(this.endDate)}T${this.hourOptions[this.hourOptions.length - 1]}:00:00`;
    }

    //console.log(`start: ${this.startDate}, end: ${this.endDate}`)

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

    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 1);

// deadline 還需要重新計算
    const payload: AddBookingPayload = {
      user_id: this.auth.getUserId(),
      rent_id: null,
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
