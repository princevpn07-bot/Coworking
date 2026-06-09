import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../services/booking';
import { Booking, BookingDetail, CalendarDay, UserOption, RentOption, EmployeeOption, CreateBookingPayload } from '../../../models/booking.model';

@Component({
  selector: 'app-bookings',
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css',
})
export class Bookings implements OnInit {
  private bookingService = inject(BookingService);
  private cdr = inject(ChangeDetectorRef);

  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  selectedDayDetails: BookingDetail[] = [];
  detailsLoading = false;
  private bookingsMap = new Map<string, Booking[]>();
  private allBookings: Booking[] = [];

  showCreateModal = false;
  submitting = false;
  submitError = '';
  rentsLoading = false;
  updatingId: number | null = null;
  userOptions: UserOption[] = [];
  rentOptions: RentOption[] = [];
  employeeOptions: EmployeeOption[] = [];
  bookingDuration = 1;
  newBooking: CreateBookingPayload = {
    user_id: null, rent_id: null, employees_id: null,
    start_date: null, end_date: null,
    company_name: null, tax_id: null,
    status: 0,
  };

  get selectedRentOption(): RentOption | null {
    return this.rentOptions.find(r => r.rent_id === this.newBooking.rent_id) ?? null;
  }

  get durationUnit(): string {
    const t = this.selectedRentOption?.price_type;
    if (t === 1) return '小時';
    if (t === 2) return '天';
    if (t === 3) return '月';
    return '';
  }

  recalcEndDate(): void {
    const start = this.newBooking.start_date ? new Date(this.newBooking.start_date) : null;
    const type = this.selectedRentOption?.price_type;
    if (!start || !type || this.bookingDuration < 1) { this.newBooking.end_date = null; return; }
    const end = new Date(start);
    if (type === 1) end.setHours(end.getHours() + this.bookingDuration);
    else if (type === 2) end.setDate(end.getDate() + this.bookingDuration);
    else if (type === 3) end.setMonth(end.getMonth() + this.bookingDuration);
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.newBooking.end_date = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  private readonly weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

  get currentMonthLabel(): string {
    return this.currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  }

  get selectedDayLabel(): string {
    if (!this.selectedDay) return '';
    const d = this.selectedDay.date;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${this.weekdays[d.getDay()]}`;
  }

  get selectedDayBookings(): Booking[] {
    if (!this.selectedDay) return [];
    return this.bookingsMap.get(this.toKey(this.selectedDay.date)) ?? [];
  }

  getBookingsForDay(day: CalendarDay): Booking[] {
    return this.bookingsMap.get(this.toKey(day.date)) ?? [];
  }

  getCoverageForDay(day: CalendarDay): { booking: Booking; roundLeft: boolean; roundRight: boolean }[] {
    const d = day.date;
    const dayTs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const isWeekStart = d.getDay() === 0;
    const isWeekEnd = d.getDay() === 6;
    const result: { booking: Booking; roundLeft: boolean; roundRight: boolean }[] = [];
    for (const b of this.allBookings) {
      if (b.status === 2 || !b.end_date) continue;
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const startTs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const endTs = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
      if (dayTs > startTs && dayTs <= endTs) {
        result.push({
          booking: b,
          roundLeft: isWeekStart,
          roundRight: dayTs === endTs || isWeekEnd,
        });
      }
    }
    return result;
  }

  statusClass(status: number): string {
    if (status === 1) return 'paid';
    if (status === 0) return 'pending';
    return 'cancelled';
  }

  statusLabel(status: number): string {
    if (status === 1) return '已付款';
    if (status === 0) return '待處理';
    return '已取消';
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${mo}/${dd} ${h}:${m}`;
  }

  private toKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  ngOnInit() {
    this.buildCalendar();
    this.bookingService.getUsers().subscribe({
      next: (data) => (this.userOptions = data.filter(u => u.role === 10 || u.role === 20)),
      error: (err) => console.error('Failed to load users', err),
    });
    this.bookingService.getEmployees().subscribe({
      next: (data) => (this.employeeOptions = data),
      error: (err) => console.error('Failed to load employees', err),
    });
    this.bookingService.getCalendar().subscribe({
      next: (data) => {
        this.allBookings = data;
        this.bookingsMap.clear();
        for (const b of data) {
          const key = this.toKey(new Date(b.start_date));
          const list = this.bookingsMap.get(key) ?? [];
          list.push(b);
          list.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
          this.bookingsMap.set(key, list);
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load bookings', err),
    });
  }

  prevMonth() {
    const d = new Date(this.currentDate);
    d.setMonth(d.getMonth() - 1);
    this.currentDate = d;
    this.buildCalendar();
  }

  nextMonth() {
    const d = new Date(this.currentDate);
    d.setMonth(d.getMonth() + 1);
    this.currentDate = d;
    this.buildCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.buildCalendar();
  }

  priceTypeLabel(type: number | null): string {
    if (type === 1) return '時租';
    if (type === 2) return '日租';
    if (type === 3) return '月租';
    return '未知';
  }

  rentLabel(rent: RentOption): string {
    return `${rent.spacename ?? '未知空間'}｜${this.priceTypeLabel(rent.price_type)}｜NT$ ${rent.price ?? '-'}`;
  }

  employeeLabel(emp: EmployeeOption): string {
    const parts = [emp.job_title, emp.department].filter(Boolean);
    return `${emp.name ?? '未命名'}｜${parts.join(' / ') || '無部門資訊'}`;
  }

  openCreateModal() {
    this.newBooking = {
      user_id: null, rent_id: null, employees_id: null,
      start_date: null, end_date: null,
      company_name: null, tax_id: null,
      status: 0,
    };
    this.bookingDuration = 1;
    this.submitError = '';
    this.rentOptions = [];
    this.showCreateModal = true;
  }

  loadAvailableRents() {
    if (!this.newBooking.start_date) return;
    this.rentsLoading = true;
    this.newBooking.rent_id = null;
    this.newBooking.end_date = null;
    this.bookingService.getRents().subscribe({
      next: (data) => { this.rentOptions = data; this.rentsLoading = false; },
      error: () => this.rentsLoading = false,
    });
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  reviewBooking(contractId: number, status: number) {
    if (this.updatingId !== null) return;
    this.updatingId = contractId;
    this.bookingService.updateStatus(contractId, status).subscribe({
      next: () => {
        const detail = this.selectedDayDetails.find(d => d.contract_id === contractId);
        if (detail) detail.status = status;
        const calKey = this.selectedDay ? this.toKey(this.selectedDay.date) : null;
        if (calKey) {
          const list = this.bookingsMap.get(calKey);
          if (list) {
            const b = list.find(b => b.contract_id === contractId);
            if (b) b.status = status;
          }
        }
        this.updatingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.updatingId = null;
        this.cdr.detectChanges();
      },
    });
  }

  cancelBooking(contractId: number) {
    if (this.updatingId !== null) return;
    this.updatingId = contractId;
    this.bookingService.cancelBooking(contractId).subscribe({
      next: () => {
        const detail = this.selectedDayDetails.find(d => d.contract_id === contractId);
        if (detail) detail.status = 2;
        const calKey = this.selectedDay ? this.toKey(this.selectedDay.date) : null;
        if (calKey) {
          const list = this.bookingsMap.get(calKey);
          if (list) {
            const b = list.find(b => b.contract_id === contractId);
            if (b) b.status = 2;
          }
        }
        this.updatingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to cancel booking', err);
        this.updatingId = null;
        this.cdr.detectChanges();
      },
    });
  }

  submitCreateBooking() {
    if (this.submitting) return;
    this.submitError = '';

    const now = new Date();
    const start = this.newBooking.start_date ? new Date(this.newBooking.start_date) : null;
    const end = this.newBooking.end_date ? new Date(this.newBooking.end_date) : null;

    if (!this.newBooking.user_id || !this.newBooking.rent_id || !this.newBooking.employees_id || !start || !end) {
      this.submitError = '請填寫所有必填欄位';
      return;
    }
    if (start <= now) {
      this.submitError = '開始時間不能是過去的時間';
      return;
    }
    if (end <= start) {
      this.submitError = '結束時間不能早於或等於開始時間';
      return;
    }

    this.submitting = true;
    this.bookingService.createBooking(this.newBooking).subscribe({
      next: () => {
        this.submitting = false;
        this.showCreateModal = false;
        this.bookingService.getCalendar().subscribe({
          next: (data) => {
            this.allBookings = data;
            this.bookingsMap.clear();
            for (const b of data) {
              const key = this.toKey(new Date(b.start_date));
              const list = this.bookingsMap.get(key) ?? [];
              list.push(b);
              list.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
              this.bookingsMap.set(key, list);
            }
            this.cdr.detectChanges();
          },
        });
      },
      error: (err) => {
        console.error('Failed to create booking', err);
        this.submitting = false;
        const body = err?.error;
        this.submitError = typeof body === 'string' ? body : (body?.message ?? '新增失敗，請確認欄位後再試');
        this.cdr.detectChanges();
      },
    });
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day;
    this.selectedDayDetails = [];
    this.detailsLoading = true;
    this.bookingService.getDetails(day.date).subscribe({
      next: (data) => {
        this.selectedDayDetails = data;
        this.detailsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load details', err);
        this.detailsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  closePanel() {
    this.selectedDay = null;
    this.selectedDayDetails = [];
  }

  isSelected(day: CalendarDay): boolean {
    return !!this.selectedDay && this.selectedDay.date.toDateString() === day.date.toDateString();
  }

  private buildCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    const days: CalendarDay[] = [];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 補上月初前的空格（上個月尾巴）
    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isOutsideMonth: true, isToday: false });
    }

    // 當月每一天
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        isOutsideMonth: false,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    // 補到 42 格（6 列 × 7 欄）
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isOutsideMonth: true, isToday: false });
    }

    this.calendarDays = days;
  }
}
