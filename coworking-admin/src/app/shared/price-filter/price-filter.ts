import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../services/location';


@Component({
  selector: 'app-price-filter',
  imports: [CommonModule, FormsModule],
  templateUrl: './price-filter.html',
  styleUrl: './price-filter.css',
})
export class PriceFilter {
  @Input() isOpen: boolean = false;
  @Output() closeMarquee = new EventEmitter<void>();
 // 🌟【寫在這裡】把原本那行舊的，替換成下面這行正確的物件型別定義
  @Output() priceApplied = new EventEmitter<{ min: number; max: number }>();

  // 內部狀態資料（租金上限 50,000）
  minVal: number = 0;
  maxVal: number = 50000;
  maxLimit: number = 50000;

  minInput: string = '0';
  maxInput: string = '50,000+';

  // Toast 狀態
  toastVisible: boolean = false;
  toastTitle: string = '';
  toastDesc: string = '';

  //  新增：在 constructor 注入 Service
  constructor(private locationService: LocationService) { }
  // 計算中間進度條的位置百分比
  get minPercent(): number {
    return (this.minVal / this.maxLimit) * 100;
  }

  get maxPercent(): number {
    return 100 - ((this.maxVal / this.maxLimit) * 100);
  }

  // 同步滑桿與輸入框的邏輯
  syncInputs(type: 'slider' | 'input') {
    if (type === 'slider') {

      // 🌟 核心體驗優化：當滑桿重疊時採取「阻擋限制」而非「對調」，避免拖曳卡死
      if (this.minVal > this.maxVal) {
        // 誰在動就卡在對方的位置
        this.minVal = this.maxVal;
      }

      // 即時同步到文字輸入框
      this.minInput = this.minVal.toLocaleString();
      this.maxInput = this.maxVal >= this.maxLimit ? '50,000+' : this.maxVal.toLocaleString();

    } else {
      // 處理手動鍵盤輸入後的數字解析
      const parsedMin = parseInt(this.minInput.replace(/\D/g, ''), 10) || 0;

      // 如果最高價輸入框內包含 '+' 或是空字串，自動帶入上限
      let parsedMax = this.maxLimit;
      if (!this.maxInput.includes('+') && this.maxInput.trim() !== '') {
        parsedMax = parseInt(this.maxInput.replace(/\D/g, ''), 10) || this.maxLimit;
      }

      // 防呆極值界線
      this.minVal = Math.min(Math.max(parsedMin, 0), this.maxLimit);
      this.maxVal = Math.min(Math.max(parsedMax, this.minVal), this.maxLimit);

      // 格式化回帶有千分位逗號的字串
      this.minInput = this.minVal.toLocaleString();
      this.maxInput = this.maxVal >= this.maxLimit ? '50,000+' : this.maxVal.toLocaleString();
    }
  }

  // 關閉選單
  closeModal(): void {
    this.closeMarquee.emit();
  }
// 🌟【寫在這裡】直接把原本戳 API 的大括號內容，替換成這幾行：
  handleApply(): void {
    // 🌟 單純把當前的最大、最小金額發送給父元件即可
    this.priceApplied.emit({ min: this.minVal, max: this.maxVal });
    this.closeModal(); // 貼心細節：套用完通常要幫使用者自動收起選單
  }


  // 推薦區間快捷鍵
  applyPreset(min: number, max: number): void {
    this.minVal = min;
    this.maxVal = max;
    this.minInput = min.toLocaleString();
    this.maxInput = max >= this.maxLimit ? '50,000+' : max.toLocaleString();

    // 觸發 Toast 提示
    this.toastTitle = '預算設定更新';
    this.toastDesc = `已切換至 $${min.toLocaleString()} - $${max >= this.maxLimit ? '50,000+' : max.toLocaleString()}`;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 2000);
  }

  // 清除全部條件
  handleClear(): void {
    this.minVal = 0;
    this.maxVal = this.maxLimit;
    this.minInput = '0';
    this.maxInput = '50,000+';

    // 提示清除成功
    this.toastTitle = '重設範圍';
    this.toastDesc = '已清除價格篩選條件';
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 1500);
  }
}
