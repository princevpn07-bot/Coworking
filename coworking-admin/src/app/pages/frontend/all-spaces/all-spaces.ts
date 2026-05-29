import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../../services/location';
import { FormsModule } from '@angular/forms';
import { PriceFilter } from '../../../shared/price-filter/price-filter';
import { RegionFilterComponent } from '../../../shared/region-filter/region-filter.component';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { AfterViewInit,ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'app-all-spaces',
  standalone: true,
  imports: [CommonModule, FormsModule, PriceFilter, RegionFilterComponent],
  templateUrl: './all-spaces.html',
  styleUrl: './all-spaces.css',
  encapsulation: ViewEncapsulation.None
})
export class AllSpaces implements OnInit, AfterViewInit {

  // 宣告空間陣列
  spaces: any[] = [];

  // 💡 新增：用來完好保存從後端 API 撈出來的「最原始、未篩選」的數據快照
  allSpacesData: any[] = [];

  selectedCapacity: number = 0; // 宣告綁定選單的人數變數（預設 0 代表不限）
  searchKeyword: string = '';   // 搜尋關鍵字

  // 💡 新增：控制價格篩選子組件開關的變數
  isPriceFilterOpen: boolean = false;
  // 💡 新增：儲存目前由子組件回傳的價格區間（預設為 0 ~ 100000）
  currentPriceRange = { min: 0, max: 100000 };
   // ------------------------------------------
  // 🗺️ 區域篩選相關變數（✨ 新增）
  // ------------------------------------------
  isRegionFilterOpen: boolean = false; // 控制地區彈窗開關
  // 儲存目前由地區子組件回傳的勾選結果
  currentRegionRange = {
    city: '',
    districts: [] as string[],
    stations: [] as string[]
  };

  // 💡 當頂端有成功 import 後，這裡的紅線就會自動消失了！
  constructor(private locationService: LocationService) { }

  map!: L.Map;
  markerLayer!: L.LayerGroup;
  ngAfterViewInit(): void {



    requestAnimationFrame(() => {

      this.map = L.map('map')
        .setView([25.0478, 121.517], 13);


      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap',
        }
      ).addTo(this.map);

      this.markerLayer =(L as any).markerClusterGroup({

        iconCreateFunction: (cluster:any) => {

          return L.divIcon({

            html: `
                <div class="cluster-inner">
                  ${cluster.getChildCount()}
                </div>
              `,

            className: 'custom-cluster',

            iconSize: L.point(50, 50)

          });

        }

      });
      this.map.addLayer(this.markerLayer);

      requestAnimationFrame(() => {
        this.map.invalidateSize(true);
        requestAnimationFrame(() => {
          this.renderMarkers();
        });

      });


    });

  }



  ngOnInit(): void {
    this.loadSpacesFromDb(); //初始載入空間資料
  }


  loadSpacesFromDb(keyword?: string, capacity?: number): void {
    this.locationService.getFrontendSpaces(keyword, capacity).subscribe({
      next: (data: any[]) => {
        console.log('✨ 成功串通！收到三表聯查的精美 DTO 數據：', data);

        const mappedSpaces = data.map((item: any) => {

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

            img: finalImg,
            // 卡片圖片：依據 space_id 輪流指派 assets 裡的精美空間圖，解決 undefined 破圖問題
            //img: `assets/Featured_space_0${(item.space_id % 4) || 1}.png`
            latitude: item.latitude,
            longitude: item.longitude

          };
        });

        this.spaces = mappedSpaces;          // 供目前畫面渲染顯示
        this.allSpacesData = mappedSpaces;   // 👈 直接把整串陣列塞給快照，紅線絕對會立刻消失！
        this.renderMarkers();

        console.log('📦 快照備份成功，目前總共有：', this.allSpacesData.length, '筆原始資料可用於篩選');
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

  }

  // 💡 新增：當使用者點選 HTML 上的「價格 ▽」按鈕時執行的開關控制
  openFilter(): void {
   // 🌟 關鍵：如果要打開價格選單，就先強制關閉地區選單
    if (!this.isPriceFilterOpen) {
      this.isRegionFilterOpen = false;
    }
    // 切換自己的狀態 (原本是 false 就變 true，原本是 true 就變 false)
    this.isPriceFilterOpen = !this.isPriceFilterOpen;
  }

  // 把原本的 budget: { min: number; max: number } 改成 any
  onPriceFilterApplied(budget: { min: number; max: number }): void {
    this.currentPriceRange = budget;
    console.log('📥 父組件收到子組件回傳的價格範圍：', budget);

    // 直接在前端對現有的資料集進行即時價格過濾
    this.applyFrontendFilters();

    // 收工關閉彈窗
    this.isPriceFilterOpen = false;
  }
   // ------------------------------------------
  // 🗺️ 區域篩選事件方法（✨ 新增）
  // ------------------------------------------

  // 當點擊「地區篩選」按鈕時打開彈窗
  openRegionFilter(): void {
    // 如果本來是開的就變關，本來是關的就變開
    this.isRegionFilterOpen = !this.isRegionFilterOpen;

    // 貼心防呆：如果打開了地區篩選，就把價格篩選主動關掉，避免兩個彈窗疊在一起
    if (this.isRegionFilterOpen) {
      this.isPriceFilterOpen = false;
    }

    console.log('🔮 地區彈窗開關已觸發，當前狀態為：', this.isRegionFilterOpen);
  }

  // 當使用者在地區子組件按下「套用篩選」時觸發
  onRegionFilterApplied(regionData: { city: string; districts: string[]; stations: string[] }): void {
    this.currentRegionRange = regionData;
    console.log('📥 父組件收到子組件回傳的地區數據：', regionData);

   // 🌟 這裡統一呼叫前端過濾中心
    this.applyFrontendFilters();
    this.isRegionFilterOpen = false;
  }


   // 💡 新增：純前端的複合式價格過濾演算法
  private applyFrontendFilters(): void {
    // 🔍 檢查快照是否有安全載入，避免對空陣列過濾
    if (!this.allSpacesData || this.allSpacesData.length === 0) {
      console.warn('⚠️ 警告：快照資料 allSpacesData 目前是空的，無法執行篩選！');
      return;
    }

    // 🌟 強制轉型純數字防呆
    const filterMin = Number(this.currentPriceRange.min);
    const filterMax = Number(this.currentPriceRange.max);

    // 拿備份的 allSpacesData 來篩選，才不會讓資料被過濾到不見
    this.spaces = this.allSpacesData.filter((space) => {
      const spacePrice = Number(space.price);

      // 檢查空間的 price 是否落在使用者選定的最下限與最上限之間
      const matchesPrice = spacePrice >= filterMin && spacePrice <= filterMax;
      // 條件 2：縣市篩選（如果子組件沒傳城市，代表不限）
      const matchesCity = !this.currentRegionRange.city || space.city === this.currentRegionRange.city;

      // 條件 3：行政區篩選（若是空陣列代表全區不限；有勾選則空間的行政區必須包含在內）
      const matchesDistrict = this.currentRegionRange.districts.length === 0 ||
        this.currentRegionRange.districts.includes(space.district);

      // 條件 4：捷運站篩選（利用 .some 檢查空間的交通敘述字串裡，有沒有包含任何一個使用者勾選的車站名稱）
      const matchesMrt = this.currentRegionRange.stations.length === 0 ||
        (space.location && this.currentRegionRange.stations.some(station => space.location.includes(station)));
      return matchesPrice && matchesCity && matchesDistrict && matchesMrt;
    });

    console.log(`🎯 前端價格過濾完成！在目前的資料中，有 ${this.spaces.length} 個空間符合預算。`);

  }

  renderMarkers(): void {

    if (!this.map) return;

    this.markerLayer.clearLayers();
    const bounds = L.latLngBounds([]);
    this.spaces.forEach(space => {
      if (space.latitude == null || space.longitude == null) return;

      const latlng: L.LatLngExpression = [
        space.latitude,
        space.longitude
      ];

      bounds.extend(latlng);

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-pin">
           <div class="marker-dot"></div>
          </div>
         `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker(latlng, { icon: customIcon, riseOnHover: true }).bindPopup(`
        <div class="map-popup">
        <div class="map-popup__title">
          ${space.name}
        </div>

        <div class="map-popup__location">
          ${space.location}
        </div>

        <div class="map-popup__price">
          NT$ ${space.price} / 月
        </div>

        </div>
      `, {
        offset: L.point(-5, -18)
      }
      ); // 調整彈出視窗位置，讓它不會蓋住 marker;
      marker.on('mouseover', () => {
        marker.openPopup();
      });

      marker.on('mouseout', () => {
        marker.closePopup();
      });

      this.markerLayer.addLayer(marker);

    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, {
        padding: [50, 50]
      });
      setTimeout(() => {
        this.map.invalidateSize(true);
      }, 50);
    }


  }


}

