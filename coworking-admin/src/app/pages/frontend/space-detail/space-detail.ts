import { Component, OnInit, inject, ChangeDetectorRef, Pipe, PipeTransform, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SpaceDetailService, SpaceDetailDto } from '../../../services/space-detail.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FavoriteService } from '../../../services/favorite';
import { ToastService } from '../../../services/toast';
import { AuthService } from '../../../services/auth';

@Pipe({ name: 'hourLabel', standalone: true })
export class HourLabelPipe implements PipeTransform {
  // 調整為接收 number 或 string，完美相容各種傳入數值
  transform(hour: number | string | null | undefined): string {
    if (hour === null || hour === undefined || hour === '') return '';
    const num = Number(hour);
    return isNaN(num) ? String(hour) : num.toString().padStart(2, '0') + ':00';
  }
}

@Component({
  selector: 'app-space-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, HourLabelPipe],
  templateUrl: './space-detail.html',
  styleUrl: './space-detail.css',
})
export class SpaceDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private spaceDetailService = inject(SpaceDetailService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private readonly apiBase = 'http://localhost:5193';

  constructor(
    private sanitizer: DomSanitizer,
    public favoriteService: FavoriteService,
    private router: Router,
    private auth: AuthService
  ) { }
// ── 自訂下拉選單控制邏輯（完全不改動原有核心功能） ──
  openedDropdown: 'start' | 'end' | null = null;

  toggleDropdown(type: 'start' | 'end') {
    this.openedDropdown = this.openedDropdown === type ? null : type;
  }

  selectHour(type: 'start' | 'end', hour: number) {
    if (type === 'start') {
      this.startHour = String(hour);
      this.onStartHourChange(); 
    } else {
      this.endHour = String(hour);
      this.onEndHourChange();   
    }
    this.openedDropdown = null; 
  }

  // 新增此專用檢門方法，徹底消滅 HTML 範本中的型別報錯紅線
  isHourSelected(type: 'start' | 'end', hour: number): boolean {
    const currentHour = type === 'start' ? this.startHour : this.endHour;
    return currentHour !== '' && Number(currentHour) === hour;
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.openedDropdown = null;
  }
  toggleFavorite(spaceId: number, event: Event) {
    event.stopPropagation();
    this.favoriteService.toggleFavorite(spaceId);
  }

  showShareModal = false;
  showCopySuccessToast = false;
  shareUrl = window.location.href;
  // 📢 新增：控制左右廣告顯示狀態的變數
  showLeftAd = false;
  showRightAd = false;
  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.shareUrl);
      this.showShareModal = false;
      this.showCopySuccessToast = true;
    } catch (error) {
      console.error(error);
    }
  }

  // ── space state ───────────────────────────────────────
  space: SpaceDetailDto | null = null;
  loading = true;
  imgBaseUrl = 'http://localhost:5193/';

  mainImage: string = '';
  galleryImages: any[] = [];
  galleryThumbs: any[] = [];
  equipments: any[] = [];
  mapUrl: SafeResourceUrl | null = null;
  lowestPrice: number = 0;
  selectedRent: any = null;

  priceTypeMap: Record<string, string> = {
    '1': '每小時',
    '2': '每日',
    '3': '每月'
  };

  activeTab: 'intro' | 'amenities' | 'location' | 'notice' | 'review' = 'intro';

  setTab(tab: 'intro' | 'amenities' | 'location' | 'notice' | 'review') {
    this.activeTab = tab;
  }

  // ── date selection state ──────────────────────────────
  dateMode: 'hour' | 'day' | 'month' = 'hour';
  today: string = new Date().toISOString().split('T')[0];
  curMonth: string = new Date().toISOString().slice(0, 7);
  hourOptions = Array.from({ length: 14 }, (_, i) => i + 8); // 8~21

  tempStartDate = '';
  startHour = '';
  endHour = '';
  startDate = '';
  endDate = '';
  hourError = false;

  bookedSlots: { startDate: string; endDate: string }[] = [];

  // ── computed ──────────────────────────────────────────
  get computedStartDate(): string {
    if (this.dateMode === 'hour') {
      if (!this.tempStartDate || !this.startHour) return '';
      return `${this.tempStartDate}T${String(this.startHour).padStart(2, '0')}:00:00`;
    }
    if (this.dateMode === 'day') return this.startDate ? `${this.startDate}T08:00:00` : '';
    if (this.dateMode === 'month') return this.startDate ? `${this.startDate}-01T08:00:00` : '';
    return '';
  }

  get computedEndDate(): string {
    if (this.dateMode === 'hour') {
      if (!this.tempStartDate || !this.endHour) return '';
      return `${this.tempStartDate}T${String(this.endHour).padStart(2, '0')}:00:00`;
    }
    if (this.dateMode === 'day') return this.endDate ? `${this.endDate}T21:00:00` : '';
    if (this.dateMode === 'month') return this.endDate ? `${this.theLastDay(this.endDate)}T21:00:00` : '';
    return '';
  }

  get diff(): number {
    if (!this.computedStartDate || !this.computedEndDate) return 0;
    if (this.dateMode === 'hour') {
      const h = Number(this.endHour) - Number(this.startHour);
      return isFinite(h) && h > 0 ? h : 0;
    }
    if (this.dateMode === 'day') {
      if (!this.startDate || !this.endDate) return 0;
      const d = Math.round((new Date(this.endDate).getTime() - new Date(this.startDate).getTime()) / 86400000) + 1;
      return isFinite(d) && d > 0 ? d : 0;
    }
    if (this.dateMode === 'month') {
      if (!this.startDate || !this.endDate) return 0;
      const s = new Date(this.startDate + '-01');
      const e = new Date(this.endDate + '-01');
      const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
      return isFinite(m) && m > 0 ? m : 0;
    }
    return 0;
  }

  get totalPrice(): number {
    return this.diff * (this.selectedRent?.price ?? 0);
  }

  get hasConflict(): boolean {
    if (!this.computedStartDate || !this.computedEndDate) return false;
    const selStart = new Date(this.computedStartDate).getTime();
    const selEnd = new Date(this.computedEndDate).getTime();
    return this.bookedSlots.some(s => {
      const slotStart = new Date(s.startDate).getTime();
      const slotEnd = new Date(s.endDate).getTime();
      return slotStart < selEnd && slotEnd > selStart;
    });
  }

  theLastDay(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month), 0);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  // ── 關閉廣告的方法 (已移到正確位置) ──
  dismissAd(side: 'left' | 'right') {
    if (side === 'left') this.showLeftAd = false;
    if (side === 'right') this.showRightAd = false;
    this.cdr.detectChanges();
  }
  // ── lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    // 📢 新增：設定頁面載入 3 秒後自動顯示廣告
    setTimeout(() => {
      this.showLeftAd = true;
      this.showRightAd = true;
      this.cdr.detectChanges(); // 強制觸發 Angular 畫面檢查
    }, 3000); // 3000 毫秒 = 3 秒
    const id = Number(this.route.snapshot.paramMap.get('id'));


    this.spaceDetailService.getSpaceDetail(id).subscribe({
      next: (data) => {
        this.space = data;
        this.galleryImages = data.images ?? [];
        this.mainImage = this.galleryImages[0]?.imagePath
          ? this.imgBaseUrl + this.galleryImages[0].imagePath
          : 'assets/no-image.png';
        this.galleryThumbs = this.galleryImages.slice(1).map(img => ({
          ...img,
          fullUrl: this.imgBaseUrl + img.imagePath
        }));


        this.equipments = data.equipments ?? [];
        this.lowestPrice = data.rents?.length
          ? Math.min(...data.rents.map((r: any) => r.price))
          : 0;
        this.selectedRent = data.rents?.[0] ?? null;
        if (this.selectedRent) this.syncDateMode(this.selectedRent.priceType);

        this.mapUrl = data.location?.address
          ? this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.google.com/maps?q=${encodeURIComponent(data.location.address)}&output=embed`
          )
          : null;

        this.loading = false;
        this.cdr.detectChanges();

        this.loadBookedSlots(id);


      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadBookedSlots(spaceId: number): void {
    this.http.get<{ startDate: string; endDate: string }[]>(
      `${this.apiBase}/api/FrontendSpaceDetail/${spaceId}/BookedSlots`
    ).subscribe({
      next: (slots) => {
        this.bookedSlots = slots;
        this.cdr.detectChanges();
      },
      error: () => { }
    });
  }

  // ── rent & date handlers ──────────────────────────────
  private syncDateMode(priceType: number): void {
    if (priceType === 1) this.dateMode = 'hour';
    else if (priceType === 2) this.dateMode = 'day';
    else if (priceType === 3) this.dateMode = 'month';
    this.resetDates();
  }

  private resetDates(): void {
    this.startDate = '';
    this.endDate = '';
    this.tempStartDate = '';
    this.startHour = '';
    this.endHour = '';
    this.hourError = false;
  }

  selectRent(rent: any) {
    this.selectedRent = rent;
    this.syncDateMode(rent.priceType);
  }

  onStartDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (this.dateMode === 'hour') {
      this.tempStartDate = val;
      this.startHour = '';
      this.endHour = '';
    } else {
      this.startDate = val;
      this.endDate = '';
    }
  }

  onEndDateChange(event: Event): void {
    if (!this.startDate) {
      this.toast.warning('請先選擇開始日期');
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.endDate = (event.target as HTMLInputElement).value;
  }

  onStartHourChange(): void {
    if (!this.tempStartDate) {
      this.toast.warning('請先選擇日期');
      setTimeout(() => { this.startHour = ''; });
      return;
    }
    this.endHour = '';
    this.hourError = false;
  }

  onEndHourChange(): void {
    if (!this.tempStartDate) {
      this.toast.warning('請先選擇日期');
      setTimeout(() => { this.endHour = ''; });
      return;
    }
    if (!this.startHour) {
      this.toast.warning('請先選擇開始時間');
      setTimeout(() => { this.endHour = ''; });
      return;
    }
    if (Number(this.endHour) <= Number(this.startHour)) {
      this.hourError = true;
      this.toast.error('結束時間必須晚於開始時間');
      setTimeout(() => { this.endHour = ''; });
      return;
    }
    this.hourError = false;
  }

  // ── booking ───────────────────────────────────────────
  goBooking(): void {
    if (!this.space || !this.selectedRent) {
      this.toast.warning('請選擇方案');
      return;
    }
    if (!this.computedStartDate || !this.computedEndDate) {
      this.toast.warning('請選擇預約時段');
      return;
    }
    if (this.hasConflict) {
      this.toast.error('此時段已被預訂，請選擇其他時間');
      return;
    }

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/space-detail/${this.space.spaceId}` }
      });
      this.toast.warning('請先登入帳號再選擇空間');
      return;
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        spaceId: this.space.spaceId,
        rentId: this.selectedRent.rentId,
        startDate: this.computedStartDate,
        endDate: this.computedEndDate,
        totalPrice: this.totalPrice,
        priceType: this.selectedRent.priceType
      }
    });
  }

}
