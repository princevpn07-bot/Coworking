import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-datetime-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datetime-filter.html',
  styleUrl: './datetime-filter.css',
 
})
export class DatetimeFilter implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() datetimeApplied = new EventEmitter<{ date: string; startTime: string; endTime: string }>();
  @Output() closeMarquee = new EventEmitter<void>();

  // --- 狀態變數 ---
  rentMode: 'hourly' | 'daily' | 'monthly' = 'hourly';
  currentDate = new Date(2026, 5, 1); // 預設 2026 年 6 月

  // 區間選擇狀態
  startDate: Date | null = new Date(2026, 5, 14);
  endDate: Date | null = new Date(2026, 5, 16);
  hoveredDate: Date | null = null;

  // 時間與下拉選單狀態
  startTime: string = '09:00';
  endTime: string = '17:00';
  startOpen: boolean = false;
  endOpen: boolean = false;

  weekdays: string[] = ['日', '一', '二', '三', '四', '五', '六'];
  calendarCells: { date: Date; day: number; isCurrentMonth: boolean }[] = [];
  timeOptions: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

  // 監聽全域點擊，用來關閉自訂的下拉時間選單
 // 監聽全域點擊，用來關閉自訂的下拉時間選單
  @HostListener('document:click')  // 🌟 修正：把後面的 , ['$event'] 刪除
  onDocumentClick() {
    this.startOpen = false;
    this.endOpen = false;
  }

  ngOnInit() {
    this.generateCalendar();
  }

  // --- 邏輯方法 ---
  setRentMode(mode: 'hourly' | 'daily' | 'monthly'): void {
    this.rentMode = mode;
    // 如果切換到日租或月租，自動鎖定營業時間
    if (mode !== 'hourly') {
      this.startTime = '08:00';
      this.endTime = '20:00';
    }
  }

  get year() { return this.currentDate.getFullYear(); }
  get month() { return this.currentDate.getMonth(); }

  shiftMonth(offset: number): void {
    this.currentDate = new Date(this.year, this.month + offset, 1);
    this.generateCalendar();
  }

  // 🌟 修正：將 HTML 裡的複雜邏輯抽成乾淨的方法
  onDayClick(cell: { date: Date; isCurrentMonth: boolean }): void {
    if (!cell.isCurrentMonth) return;
    const date = cell.date;
    
    if (!this.startDate || (this.startDate && this.endDate)) {
      this.startDate = date;
      this.endDate = null;
    } else {
      if (date < this.startDate) {
        this.startDate = date;
        this.endDate = null;
      } else {
        this.endDate = date;
      }
    }
  }

  onDayHover(cell: { date: Date; isCurrentMonth: boolean }): void {
    if (cell.isCurrentMonth && this.startDate && !this.endDate) {
      this.hoveredDate = cell.date;
    }
  }

  // --- 🌟 新增：膠囊連線樣式推導引擎 ---
  private stripTime(d: Date | null): number | null {
    return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : null;
  }

  // 決定底層「淺褐色連線」的位置
  getWrapperClasses(date: Date) {
    const d = this.stripTime(date)!;
    const s = this.stripTime(this.startDate);
    const e = this.stripTime(this.endDate) || this.stripTime(this.hoveredDate);

  // 如果只選一天，不需要連線
    if (!s || !e || s === e) return {};
    const min = Math.min(s, e);
    const max = Math.max(s, e);

    return {
      'in-range': d > min && d < max,
      'range-start': d === min && min !== max,
      'range-end': d === max && min !== max
    };
  }
// 決定表層「深褐色頭尾」的圓角形狀
  getCellClasses(cell: { date: Date; isCurrentMonth: boolean }) {
    if (!cell.isCurrentMonth) return { 'other-month': true };
    
    const d = this.stripTime(cell.date)!;
    const s = this.stripTime(this.startDate);
    const e = this.stripTime(this.endDate) || this.stripTime(this.hoveredDate);

    if (!s) return {};
    
    // 如果只選一天
    if (!e || s === e) {
      return { 'selected-day': d === s, 'single-select': d === s };
    }

    const min = Math.min(s, e);
    const max = Math.max(s, e);

    return {
      'selected-day': d === min || d === max,
      'start-date': d === min,
      'end-date': d === max
    };
  }

  // 判斷樣式的方法
  isSelected(date: Date): boolean {
    if (this.startDate && date.toDateString() === this.startDate.toDateString()) return true;
    if (this.endDate && date.toDateString() === this.endDate.toDateString()) return true;
    return false;
  }

  isRangeSelected(date: Date): boolean {
    if (!this.startDate) return false;
    const dateMs = date.getTime();
    const startMs = this.startDate.getTime();

    if (this.endDate) return dateMs > startMs && dateMs < this.endDate.getTime();
    if (this.hoveredDate) return dateMs > startMs && dateMs < this.hoveredDate.getTime();
    
    return false;
  }

  // 計算天數
  get daysCount(): number {
    if (!this.startDate) return 0;
    if (!this.endDate) return 1;
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // 動態顯示文字
  get rentModeName(): string {
    return { 'hourly': '時租', 'daily': '日租', 'monthly': '月租' }[this.rentMode] || '時租';
  }

  get priceDisplay(): string {
    return { 'hourly': 'NT$600 / 小時', 'daily': 'NT$3,000 / 天', 'monthly': 'NT$15,000 / 月' }[this.rentMode] || '';
  }

  // 產生當月日曆
  generateCalendar(): void {
    const firstDayIndex = new Date(this.year, this.month, 1).getDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const prevMonthDays = new Date(this.year, this.month, 0).getDate();

    this.calendarCells = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      this.calendarCells.push({ day: prevMonthDays - i, date: new Date(this.year, this.month - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarCells.push({ day: i, date: new Date(this.year, this.month, i), isCurrentMonth: true });
    }
    const remaining = 42 - this.calendarCells.length;
    for (let i = 1; i <= remaining; i++) {
      this.calendarCells.push({ day: i, date: new Date(this.year, this.month + 1, i), isCurrentMonth: false });
    }
  }

  // 🌟 修正：將下拉選單選擇抽成方法
  selectStartTime(time: string) {
    this.startTime = time;
    this.startOpen = false;
    if (parseInt(time) >= parseInt(this.endTime)) {
      const nextHr = parseInt(time) + 2;
      this.endTime = nextHr < 22 ? `${nextHr.toString().padStart(2, '0')}:00` : '22:00';
    }
  }

  selectEndTime(time: string) {
    if (time > this.startTime) {
      this.endTime = time;
      this.endOpen = false;
    }
  }

  // 套用並回傳
  applyFilter(): void {
    const formatDate = (d: Date | null) => d ? `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}` : '';
    
    const startStr = formatDate(this.startDate);
    const endStr = formatDate(this.endDate);
    const finalDateStr = endStr ? `${startStr} 至 ${endStr}` : startStr;

    this.datetimeApplied.emit({
      date: finalDateStr,
      startTime: this.startTime,
      endTime: this.endTime
    });
  }
 
}