import { Component , Input, Output, EventEmitter} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-region-filter',
  imports: [CommonModule],
  templateUrl: './region-filter.component.html',
  styleUrl: './region-filter.component.css',
})
export class RegionFilterComponent {

@Input() isOpen: boolean = false;
  @Output() closeMarquee = new EventEmitter<void>();

  // 🌟 當使用者點擊最下方套用或關閉時，把最終選擇的資料打包丟給父組件
  @Output() regionApplied = new EventEmitter<{ city: string; districts: string[]; stations: string[] }>();

  // ==========================================
  // 1. HTML 內 *ngFor 所需的基礎資料來源
  // ==========================================

  // 縣市清單陣列
  cities = [
    { id: 'tw-tp', name: '台北市', imgUrl: 'assets/taipei.png', alt: '台北市景' },
    { id: 'tw-ntpc', name: '新北市', imgUrl: 'assets/new_taipei.png', alt: '新北市景' },
    { id: 'tw-tc', name: '台中市', imgUrl: 'assets/taichung.png', alt: '台中市景' },
    { id: 'tw-tn', name: '台南市', imgUrl: 'assets/tainan.png', alt: '台南市景' }
  ];

  // 行政區對照字典（Key 為 縣市 id）
  districts: { [key: string]: string[] } = {
    'tw-tp': ['西區', '士林區', '大同區', '中山區', '松山區', '中正區', '大安區', '萬華區', '信義區'],
    'tw-ntpc': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '淡水區'],
    'tw-tc': ['西區', '北區', '南區', '西屯區', '南屯區'],
    'tw-tn': ['安平區', '中西區', '東區', '北區']
  };

  // 捷運線清單
  mrtLines = [
    { id: 'line-br', name: 'BR 文湖線' },
    { id: 'line-r', name: 'R 淡水信義線' },
    { id: 'line-g', name: 'G 松山新店線' }
  ];

  // 捷運站對照字典（Key 為 捷運線 id）
  mrtStations: { [key: string]: string[] } = {
    'line-br': ['動物園', '木柵', '萬芳社區', '六張犁', '科技大樓', '大安'],
    'line-r': ['象山', '台北101/世貿', '信義安和', '大安', '東門', '台北車站'],
    'line-g': ['新店', '公館', '古亭', '中正紀念堂', '西門', '中山', '松山']
  };

  // ==========================================
  // 2. HTML 內綁定使用的控製變數（狀態控制）
  // ==========================================
  selectedCityId: string = 'tw-tp';     // 預設選中台北市
  activeMrtLineId: string = 'line-br';   // 預設選中文湖線

  // 複選儲存槽：因為看你用 toggle，代表允許使用者同時勾選多個行政區或捷運站
  selectedDistricts: string[] = [];      // 已選中的行政區清單
  selectedStations: string[] = [];       // 已選中的捷運車站清單

  // ==========================================
  // 3. HTML 內綁定的所有 click 事件方法
  // ==========================================

  // 切換縣市
  selectCity(cityId: string): void {
    this.selectedCityId = cityId;
    // 貼心細節：換縣市時，主動把上一個縣市勾選的行政區清空，避免邏輯打架
    this.selectedDistricts = [];
  }

  // 行政區的單選/複選切換切換邏輯
  toggleDistrict(districtName: string): void {
    const index = this.selectedDistricts.indexOf(districtName);
    if (index > -1) {
      this.selectedDistricts.splice(index, 1); // 原本有選就拔掉
    } else {
      this.selectedDistricts.push(districtName); // 原本沒選就塞入
    }
  }

  // 判斷該行政區按鈕現在是否為選中狀態（回傳 boolean 給 [class.selected]）
  isDistrictSelected(districtName: string): boolean {
    return this.selectedDistricts.includes(districtName);
  }

  // 切換當前顯示的捷運線分頁
  selectMrtLine(lineId: string): void {
    this.activeMrtLineId = lineId;
  }

  // 捷運站的單選/複選切換邏輯
  toggleStation(stationName: string): void {
    const index = this.selectedStations.indexOf(stationName);
    if (index > -1) {
      this.selectedStations.splice(index, 1);
    } else {
      this.selectedStations.push(stationName);
    }
  }

  // 判斷該捷運站按鈕現在是否為選中狀態（回傳 boolean 給 [class.selected]）
  isStationSelected(stationName: string): boolean {
    return this.selectedStations.includes(stationName);
  }

  // 縣市卡片左右跑馬燈切換（目前先留空防爆，你可以依需求實作位移邏輯）
  shiftCity(direction: 'left' | 'right'): void {
    console.log(`縣市卡片向 ${direction} 滾動`);
    // 可以在這裡寫改變 cities 陣列順序或調整 CSS transform 的邏輯
  }

  // ==========================================
  // 4. 提交與關閉
  // ==========================================
  closeModal(): void {
    this.closeMarquee.emit();
  }

  // 當使用者點擊最終確定按鈕時呼叫
  submitFilter(): void {
    // 找出目前選中縣市的中文名稱
    const currentCity = this.cities.find(c => c.id === this.selectedCityId);

    this.regionApplied.emit({
      city: currentCity ? currentCity.name : '',
      districts: this.selectedDistricts,
      stations: this.selectedStations
    });

    this.closeModal();
  }

}
