import { Component, Input, HostListener } from '@angular/core'; // 👈 確保引入 HostListener
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-floating-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './floating-header.html',
  styleUrl: './floating-header.css',
})
export class FloatingHeader {
  @Input() isVisible: boolean = false;
  @Input() scrollPercentage: number = 0; // 🚀 全新追加：接收全域滾動百分比的輸入雷達
  isExpanded = false; // 預設展開
  // 🚀 全新追加：夜間模式開關狀態機
  isDarkMode = false;
// 🚀 全新追加：全域最小化（完全隱藏至右側邊界）狀態機
  isMinimized = false;
  // 🚀 全新追加：拖曳狀態機
  isDragging = false;
  offsetX = 0; // 當前水平位移量
  offsetY = 0; // 當前垂直位移量

  private initialMouseX = 0;
  private initialMouseY = 0;
  private savedOffsetX = 0; // 儲存上一次拖曳結束後的累積 X 位移
  private savedOffsetY = 0; // 儲存上一次拖曳結束後的累積 Y 位移

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
  // 🚀 全新追加：開關燈點火核心
  toggleTheme(event: MouseEvent) {
    event.stopPropagation(); // 🔒 剛性看守：阻止事件冒泡，防止觸發外層膠囊的滑鼠拖曳行為
    this.isDarkMode = !this.isDarkMode;
    
    // 🎬 將 .dark-mode 類別動態掛載到全域 body 上，讓所有元件都能進行聯動
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  // 🚀 全新追加：一鍵完全全關閉、藏至最右側
  minimizeCapsule(event: MouseEvent) {
    event.stopPropagation(); // 🔒 剛性看守：阻止事件冒泡，防止觸發滑鼠拖曳
    this.isMinimized = true;
  }
  // 🚀 全新追加：點擊邊緣手柄，還原膠囊島
  restoreCapsule() {
    this.isMinimized = false;
  }

  // 🎬 當滑鼠在膠囊上按下時觸發
  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // 🔒 剛性看守：如果點擊的是連結或按鈕，交由原生路由或收合事件處理，不觸發拖曳
    if (target.closest('a') || target.closest('button')) {
      return;
    }

    this.isDragging = true;
    this.initialMouseX = event.clientX;
    this.initialMouseY = event.clientY;

    // 阻止瀏覽器預設的文字選取行為
    event.preventDefault();
  }

  // 🎬 全域監聽滑鼠移動
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    // 即時計算「本次拖曳距離」並加上「歷史累積位移量」
    this.offsetX = this.savedOffsetX + (event.clientX - this.initialMouseX);
    this.offsetY = this.savedOffsetY + (event.clientY - this.initialMouseY);
  }

  // 🎬 全域監聽滑鼠放開
  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      // 凍結並儲存當前的位移座標，作為下一次拖曳的基準起點
      this.savedOffsetX = this.offsetX;
      this.savedOffsetY = this.offsetY;
    }
  }

  // 🚀 動態計算渲染樣式：完美揉合原本的 left: 50% 置中與自訂拖曳座標
  getTransformStyle(): string {
    const baseEntryY = this.isVisible ? 0 : -20; // 呼應原本未進場時上移 20px 的隱現動畫

    if (this.isMinimized) {
      // 🎬 當被全關閉時，膠囊一邊平滑轉向右側滑移 280px，一邊向內縮小比例淡出，極具流線感
      return `translate(calc(-50% + ${this.offsetX}px + 280px), calc(${baseEntryY}px + ${this.offsetY}px)) scale(0.6)`;
    }
    return `translate(calc(-50% + ${this.offsetX}px), calc(${baseEntryY}px + ${this.offsetY}px))`;
  }
}