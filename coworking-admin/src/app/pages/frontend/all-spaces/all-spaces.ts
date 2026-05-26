import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../../services/location';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-all-spaces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-spaces.html',
  styleUrl: './all-spaces.css',
})
export class AllSpaces implements OnInit {

  // 宣告空間陣列
  spaces: any[] = [];
  selectedCapacity: number = 0; // 宣告綁定選單的人數變數（預設 0 代表不限）
  searchKeyword: string = '';   // 搜尋關鍵字

  // 💡 當頂端有成功 import 後，這裡的紅線就會自動消失了！
  constructor(private locationService: LocationService) { }

  ngOnInit(): void {
    this.loadSpacesFromDb(); //初始載入空間資料
  }

  loadSpacesFromDb(keyword?: string, capacity?: number): void {
    this.locationService.getFrontendSpaces(keyword, capacity).subscribe({
      next: (data: any[]) => {
        console.log('✨ 成功串通！收到三表聯查的精美 DTO 數據：', data);

        // 💡 100% 純動態映射，直接點亮網頁卡片
        this.spaces = data.map((item: any) => {
          // 🌟 核心修正：處理真實資料庫圖片網址
          // 如果資料庫有回傳 image_path，就黏上後端伺服器主機網址（例如 http://localhost:5193）
          // 如果沒圖，就拿原本的 assets/Featured_space_01.png 當作備用防破圖
          const finalImg = item.image_path
            ? `http://localhost:5193${item.image_path}`
            : 'assets/Featured_space_01.png';
          // 空間名稱：用資料庫撈出來的城市 + 空間編號組合（例如：黃金的時刻 · 專屬空間 101）

          return {
            name: `${item.city || '共享空間'} ·  ${item.space_number || ''}`,

            // 方案價格：精準抓取自 dbo.rents 的真實租金方案價格！
            price: item.price || 15000,

            // 人數容量：直接顯示幾人空間
            capacity: `${item.capacity || 0}人`,

            // 交通資訊：直接顯示資料庫 dbo.Locations.mrt_info 的超長細節敘述！
            location: item.mrt_info || '捷運站步行可達',

            img: finalImg
            // 卡片圖片：依據 space_id 輪流指派 assets 裡的精美空間圖，解決 undefined 破圖問題
            //img: `assets/Featured_space_0${(item.space_id % 4) || 1}.png`
          };
        });
      },
      error: (err) => {
        console.error('❌ 前端讀取 API 失敗，請確認後端是否正在啟動狀態：', err);
      }
    });
  }
  // 🌟 新增：當使用者點擊「搜尋」按鈕時觸發的方法
  onSearch(): void {
    // 如果使用者把搜尋框刪光光了（變空白字串），我們就主動傳 undefined 讓 Service 撈全部資料
    const targetKeyword = this.searchKeyword.trim() ? this.searchKeyword.trim() : undefined;
    const targetCapacity = this.selectedCapacity > 0 ? this.selectedCapacity : undefined;

    console.log('🔍 開始搜尋關鍵字：', this.searchKeyword);
    this.loadSpacesFromDb(targetKeyword, targetCapacity);
    /* spaces = [
       { name: 'The Timber Lounge', location: '捷運大安站 2 分鐘', price: '8,500', capacity: '8人', img: 'assets/Featured_space_01.png' },
       { name: 'Clay & Canvas Studio', location: '捷運信義安和站 5 分鐘', price: '12,000', capacity: '3人', img: 'assets/Featured_space_02.png' },
       { name: 'Zen Archive Office', location: '捷運南京復興站 3 分鐘', price: '15,000', capacity: '12人', img: 'assets/Featured_space_03.png' },
       { name: 'The Collective Workspace', location: '捷運市政府站 5 分鐘', price: '25,000', capacity: '20人', img: 'assets/Featured_space_04.png' },
       { name: 'Urban Nest Hub', location: '捷運中山站 4 分鐘', price: '9,800', capacity: '6人', img: 'assets/Featured_space_01.png' },
       { name: 'Creative Loft', location: '捷運忠孝敦化 2 分鐘', price: '18,000', capacity: '15人', img: 'assets/Featured_space_02.png' },
       { name: 'The Timber Lounge', location: '捷運大安站 2 分鐘', price: '8,500', capacity: '8人', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
       { name: 'Clay & Canvas Studio', location: '捷運信義安和站 5 分鐘', price: '12,000', capacity: '3人', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800' },
       { name: 'Zen Archive Office', location: '捷運南京復興站 3 分鐘', price: '15,000', capacity: '12人', img
       { name: 'The Collective Workspace', location: '捷運市政府站 5 分鐘', price: '25,000', capacity: '20人', img: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800' },
       { name: 'Clay & Canvas Studio', location: '捷運信義安和站 5 分鐘', price: '12,000', capacity: '3人', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800' },
       { name: 'The Collective Workspace', location: '捷運市政府站 5 分鐘', price: '25,000', capacity: '20人', img: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800' },
     ];
     */
  }
}

