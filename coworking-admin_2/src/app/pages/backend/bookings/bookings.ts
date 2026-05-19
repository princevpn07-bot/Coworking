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

  showCreateModal = false;
  submitting = false;
  submitError = '';
  updatingId: number | null = null;
  userOptions: UserOption[] = [];
  rentOptions: RentOption[] = [];
  employeeOptions: EmployeeOption[] = [];
  newBooking: CreateBookingPayload = {
    user_id: null, rent_id: null, employees_id: null,
    start_date: null, end_date: null,
    company_name: null, tax_id: null,
    status: 0,
  };

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

  private toKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  ngOnInit() {
    this.buildCalendar();
    this.bookingService.getCalendar().subscribe({
      next: (data) => {
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
    return `方案 #${rent.rent_id}｜${this.priceTypeLabel(rent.price_type)}｜NT$ ${rent.price ?? '-'}`;
  }

  employeeLabel(emp: EmployeeOption): string {
    const parts = [emp.job_title, emp.department].filter(Boolean);
    return `員工 #${emp.employees_id}｜${parts.join(' / ') || '無部門資訊'}`;
  }

  openCreateModal() {
    this.newBooking = {
      user_id: null, rent_id: null, employees_id: null,
      start_date: null, end_date: null,
      company_name: null, tax_id: null,
      status: 0,
    };
    this.showCreateModal = true;
    if (this.userOptions.length === 0) {
      this.bookingService.getUsers().subscribe({
        next: (data) => (this.userOptions = data.filter(u => u.role === 10 || u.role === 20)),
        error: (err) => console.error('Failed to load users', err),
      });
    }
    if (this.rentOptions.length === 0) {
      this.bookingService.getRents().subscribe({
        next: (data) => (this.rentOptions = data),
        error: (err) => console.error('Failed to load rents', err),
      });
    }
    if (this.employeeOptions.length === 0) {
      this.bookingService.getEmployees().subscribe({
        next: (data) => (this.employeeOptions = data.filter(e => e.is_active)),
        error: (err) => console.error('Failed to load employees', err),
      });
    }
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

  submitCreateBooking() {
    if (this.submitting) return;
    this.submitting = true;
    this.submitError = '';
    this.bookingService.createBooking(this.newBooking).subscribe({
      next: () => {
        this.submitting = false;
        this.showCreateModal = false;
        this.bookingService.getCalendar().subscribe({
          next: (data) => {
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
