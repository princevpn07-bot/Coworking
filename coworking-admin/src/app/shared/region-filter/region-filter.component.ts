import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-region-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './region-filter.component.html',
  styleUrl: './region-filter.component.css',
})
export class RegionFilterComponent {

  @Input() isOpen: boolean = false;
  @Output() closeMarquee = new EventEmitter<void>();

  // 🌟 當使用者點擊最下方套用或關閉時，把最終選擇的資料打包丟給父組件
  @Output() regionApplied = new EventEmitter<{ city: string; districts: string[]; stations: string[] }>();

  // 綁定最上方縣市圖片卡片的滾動
  @ViewChild('regionGrid') regionGrid!: ElementRef;
@ViewChild('districtScrollBody') districtScrollBody!: ElementRef; // 🌟 新增
@ViewChild('mrtScrollBody') mrtScrollBody!: ElementRef;           // 🌟 新增
  /**
   * 🌟 核心修正：通用左右按鍵滑動控制
   * 自動相容 ElementRef 與原生 HTMLDivElement，確保滑動 100% 生效
   */
  scrollContainer(container: any, direction: 'left' | 'right'): void {
    if (!container) return;

    // 💡 自動防呆：如果傳進來的是 Angular 的 ElementRef，就拆出裡面的 nativeElement
    const targetElement = container.nativeElement ? container.nativeElement : container;

    // 每次點擊滑動該容器「可視寬度」的 75%，留一點點邊緣讓使用者有視覺連續感
    const scrollAmount = targetElement.clientWidth * 0.75;

    // 使用標準且平滑的 scrollBy 動態位移
    targetElement.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth' as ScrollBehavior // 強制指定平滑滾動動畫
    });
  }

  /**
   * 🌟 優化：頂部城市大圖跑馬燈滑動
   * 同步改用與底下一致的平滑滾動機制
   */
  shiftCity(direction: 'left' | 'right'): void {
    if (!this.regionGrid) return;
    this.scrollContainer(this.regionGrid, direction);
  }

  // ==========================================
  // 1. HTML 內 *ngFor 所需的基礎資料來源
  // ==========================================
  regions = ['北部', '中部', '南部', '東部與離島'];

  // 核心樹狀結構：大區域 -> 縣市 -> (行政區與捷運資訊)
  taiwanRegionData: { [key: string]: any } = {
    '北部': {
      cities: [
        { id: 'tw-tp', name: '台北市', imgUrl: 'assets/area/taipei.webp', alt: '台北市景' },
        { id: 'tw-ntpc', name: '新北市', imgUrl: 'assets/area/new_taipei.webp', alt: '新北市景' },
        { id: 'tw-keelung', name: '基隆市', imgUrl: 'assets/area/keelung.webp', alt: '基隆市景' },
        { id: 'tw-ty', name: '桃園市', imgUrl: 'assets/area/taoyuan.webp', alt: '桃園市景' }
      ],
      cityDetails: {
        'tw-tp': {
          districts: ['中正區', '大同區', '中山區', '松山區',
            '大安區', '萬華區', '信義區', '士林區',
            '北投區', '內湖區', '南港區', '文山區'],
          mrtLines: [
            {
              id: 'line-br',
              name: 'BR 文湖線',
              stations: ['南港展覽館', '內湖', '大直', '南京復興', '忠孝復興', '大安', '六張犁', '科技大樓', '萬芳醫院', '動物園']
            },
            {
              id: 'line-r',
              name: 'R 淡水信義線',
              stations: ['淡水', '北投', '士林', '圓山', '雙連', '中山', '台北車站', '東門', '大安', '信義安和', '台北101/世貿', '象山']
            },
            {
              id: 'line-g',
              name: 'G 松山新店線',
              stations: ['松山', '南京三民', '南京復興', '松江南京', '中山', '西門', '中正紀念堂', '古亭', '公館', '大坪林', '新店']
            },
            {
              id: 'line-o',
              name: 'O 中和新蘆線',
              stations: ['蘆洲', '迴龍', '三重', '大橋頭', '民權西路', '松江南京', '忠孝新生', '東門', '古亭', '頂溪', '景安', '南勢角']
            },
            {
              id: 'line-bl',
              name: 'BL 板南線',
              stations: ['南港展覽館', '南港', '昆陽', '市政府', '國父紀念館', '忠孝敦化', '忠孝復興', '忠孝新生', '台北車站', '西門', '龍山寺', '板橋', '府中', '頂埔']
            }
          ]
        },
        'tw-ntpc': {
          districts: ['板橋區', '三重區', '中和區', '永和區', '新莊區', '淡水區', '新店區', '汐止區', '土城區', '蘆洲區', '樹林區'],
          mrtLines: []
        }
      }
    },
    '中部': {
      cities: [
        { id: 'tw-tc', name: '台中市', imgUrl: 'assets/area/taichung.webp', alt: '台中市景' },
        { id: 'tw-ch', name: '彰化縣', imgUrl: 'assets/area/changhua.webp', alt: '彰化縣景' },
        { id: 'tw-nt', name: '南投縣', imgUrl: 'assets/area/nantou.webp', alt: '南投縣景' },
        { id: 'tw-ml', name: '苗栗縣', imgUrl: 'assets/area/miaoli.webp', alt: '苗栗縣景' },
        { id: 'tw-yl', name: '雲林縣', imgUrl: 'assets/area/yunlin.webp', alt: '雲林縣景' }
      ],
      cityDetails: {
        'tw-tc': {
          districts: [
            '西屯區', '南屯區', '北屯區', '西區',
            '北區', '中區', '東區', '南區',
            '豐原區', '大里區', '太平區', '烏日區'
          ],
          mrtLines: [
            {
              id: 'line-tc-green',
              name: '台中綠線',
              stations: ['北屯總站', '松竹', '文心崇德', '文華高中', '市政府', '水安宮', '文心森林公園', '豐樂公園', '大慶', '高鐵台中站']
            }
          ]
        },
        'tw-ch': {
          districts: ['彰化市', '員林市', '鹿港鎮', '和美鎮', '溪湖鎮', '二林鎮', '田中鎮', '花壇鄉'],
          mrtLines: []
        },
        'tw-nt': {
          districts: ['南投市', '草屯鎮', '埔里鎮', '竹山鎮', '名間鄉', '水里鄉', '魚池鄉'],
          mrtLines: []
        },
        'tw-ml': {
          districts: ['苗栗市', '頭份市', '竹南鎮', '苑裡鎮', '後龍鎮', '通霄鎮', '公館鄉'],
          mrtLines: []
        },
        'tw-yl': {
          districts: ['斗六市', '虎尾鎮', '西螺鎮', '斗南鎮', '北港鎮', '麥寮鄉', '古坑鄉'],
          mrtLines: []
        }
      }
    },
    '南部': {
      cities: [
        { id: 'tw-kh', name: '高雄市', imgUrl: 'assets/area/kaohsiung.webp', alt: '高雄市景' },
        { id: 'tw-tn', name: '台南市', imgUrl: 'assets/area/tainan.webp', alt: '台南市景' },
        { id: 'tw-cyi', name: '嘉義市', imgUrl: 'assets/area/chiayi_city.webp', alt: '嘉義市景' },
        { id: 'tw-cyh', name: '嘉義縣', imgUrl: 'assets/area/chiayi_county.webp', alt: '嘉義縣景' },
        { id: 'tw-pt', name: '屏東縣', imgUrl: 'assets/area/pingtung.webp', alt: '屏東縣景' }
      ],
      cityDetails: {
        'tw-kh': {
          districts: [
            '左營區', '鼓山區', '三民區', '新興區',
            '前金區', '苓雅區', '前鎮區', '小港區',
            '鳳山區', '楠梓區', '仁武區', '鳥松區'
          ],
          mrtLines: [
            {
              id: 'line-kh-r',
              name: 'R 高雄紅線',
              stations: ['岡山車站', '楠梓科技園區', '左營/高鐵', '生態園區', '巨蛋', '後驛', '高雄車站', '美麗島', '中央公園', '三多商圈', '前鎮高中', '草衙', '小港']
            },
            {
              id: 'line-kh-o',
              name: 'O 高雄橘線',
              stations: ['哈瑪星', '鹽埕埔', '市議會', '美麗島', '信義國小', '文化中心', '五塊厝', '技擊館', '衛武營', '鳳山', '大寮']
            }
          ]
        },
        'tw-tn': {
          districts: ['中西區', '東區', '安平區', '北區', '南區', '安南區', '永康區', '歸仁區', '善化區', '新市區'],
          mrtLines: []
        },
        'tw-cyi': {
          districts: ['西區', '東區'],
          mrtLines: []
        },
        'tw-cyh': {
          districts: ['太保市', '朴子市', '民雄鄉', '水上鄉', '中埔鄉', '竹崎鄉'],
          mrtLines: []
        },
        'tw-pt': {
          districts: ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉'],
          mrtLines: []
        }
      }
    },
    '東部與離島': {
      cities: [
        { id: 'tw-il', name: '宜蘭縣', imgUrl: 'assets/area/yilan.webp', alt: '宜蘭縣景' },
        { id: 'tw-hl', name: '花蓮縣', imgUrl: 'assets/area/hualien.webp', alt: '花蓮縣景' },
        { id: 'tw-tt', name: '台東縣', imgUrl: 'assets/area/taitung.webp', alt: '台東縣景' },
        { id: 'tw-ph', name: '澎湖縣', imgUrl: 'assets/area/penghu.webp', alt: '澎湖縣景' },
        { id: 'tw-km', name: '金門縣', imgUrl: 'assets/area/kinmen.webp', alt: '金門縣景' },
        { id: 'tw-lc', name: '連江縣', imgUrl: 'assets/area/matsu.webp', alt: '連江馬祖縣景' }
      ],
      cityDetails: {
        'tw-il': {
          districts: ['宜蘭市', '羅東鎮', '礁溪鄉', '頭城鎮', '蘇澳鎮', '五結鄉', '冬山鄉'],
          mrtLines: []
        },
        'tw-hl': {
          districts: ['花蓮市', '吉安鄉', '壽豐鄉', '新城鄉', '玉里鎮', '瑞穗鄉'],
          mrtLines: []
        },
        'tw-tt': {
          districts: ['台東市', '卑南鄉', '鹿野鄉', '太麻里鄉', '成功鎮', '關山鎮'],
          mrtLines: []
        },
        'tw-ph': {
          districts: ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉'],
          mrtLines: []
        },
        'tw-km': {
          districts: ['金城鎮', '金湖鎮', '金沙鎮', '金寧鄉', '烈嶼鄉'],
          mrtLines: []
        },
        'tw-lc': {
          districts: ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉'],
          mrtLines: []
        }
      }
    }
  };

  // ==========================================
  // 2. 狀態控制變數
  // ==========================================
  selectedRegion: string = '北部';
  selectedCityId: string = 'tw-tp';
  activeMrtLineId: string = 'line-br';

  selectedDistricts: string[] = [];
  selectedStations: string[] = [];

  // ==========================================
  // 3. Getter 輔助器
  // ==========================================
  get currentCities(): any[] {
    return this.taiwanRegionData[this.selectedRegion]?.cities || [];
  }

  get currentCityDetails(): any {
    return this.taiwanRegionData[this.selectedRegion]?.cityDetails?.[this.selectedCityId] || null;
  }

  get currentMrtStations(): string[] {
    const lines = this.currentCityDetails?.mrtLines || [];
    const activeLine = lines.find((l: any) => l.id === this.activeMrtLineId);
    return activeLine ? activeLine.stations : [];
  }

  // ==========================================
  // 4. 動態事件方法
  // ==========================================
  selectRegion(regionName: string): void {
    this.selectedRegion = regionName;
    const firstCity = this.currentCities[0];

  //this.resetScrollPositions();
// 💡 體驗大升級：點擊大區域分頁時，全面重置所有捲軸（包含大區域、行政區、捷運）
  this.resetAllScrolls({ resetRegion: true, resetSub: true });
    if (firstCity) {
      this.selectCity(firstCity.id);
    } else {
      this.selectedCityId = '';
      this.clearSubSelection();
    }
  }

  /**
 * 🌟 新增：重置行政區與捷運容器滾動條的核心防呆方法
 */
private resetScrollPositions(): void {
  // 使用 setTimeout 確保 Angular 已經渲染完切換後的全新資料，再執行滾動歸零
  setTimeout(() => {
    if (this.districtScrollBody?.nativeElement) {
      this.districtScrollBody.nativeElement.scrollLeft = 0;
    }
    if (this.mrtScrollBody?.nativeElement) {
      this.mrtScrollBody.nativeElement.scrollLeft = 0;
    }
  }, 0);
}

  selectCity(cityId: string): void {
    this.selectedCityId = cityId;
    this.selectedDistricts = [];
    this.selectedStations = [];

    // 💡 體驗大升級：換縣市時，把下方的行政區跟捷運捲軸拉回最左邊
  this.resetAllScrolls({ resetRegion: false, resetSub: true });
    const lines = this.currentCityDetails?.mrtLines || [];
    if (lines.length > 0) {
      this.activeMrtLineId = lines[0].id;
    } else {
      this.activeMrtLineId = '';
    }
  }

  // ==========================================
// 🌟 3. 新增：全自動滾動條歸零重置核心防呆
// ==========================================
private resetAllScrolls(options: { resetRegion: boolean; resetSub: boolean }): void {
  // 使用 setTimeout 確保 Angular 已經重新渲染完換過縣市的按鈕
  setTimeout(() => {
    // 如果需要重置最頂部的大分頁
    if (options.resetRegion) {
      const regionEl = document.getElementById('regionScrollContainer');
      if (regionEl) regionEl.scrollLeft = 0;
    }

    // 如果需要重置下方的行政區與捷運
    if (options.resetSub) {
      const districtEl = document.getElementById('districtScrollContainer');
      const mrtEl = document.getElementById('mrtScrollContainer');

      if (districtEl) districtEl.scrollLeft = 0;
      if (mrtEl) mrtEl.scrollLeft = 0;
    }
  }, 10); // 10ms 緩衝，確保 DOM 完全渲染完畢
}

  clearSubSelection(): void {
    this.selectedDistricts = [];
    this.selectedStations = [];
  }

  toggleDistrict(districtName: string): void {
    const index = this.selectedDistricts.indexOf(districtName);
    if (index > -1) {
      this.selectedDistricts.splice(index, 1);
    } else {
      this.selectedDistricts.push(districtName);
    }
  }

  isDistrictSelected(districtName: string): boolean {
    return this.selectedDistricts.includes(districtName);
  }

  selectMrtLine(lineId: string): void {
    this.activeMrtLineId = lineId;
    // 💡 每當切換不同的捷運路線時，強迫下方的捷運站點捲軸秒速歸零！
  this.resetMrtStationsScroll();
  }
/**
 * 🌟 新增：專屬捷運站點滾動條歸零方法
 */
private resetMrtStationsScroll(): void {
  // 使用 setTimeout 確保 Angular 已經將新路線的捷運站按鈕渲染完畢再歸零
  setTimeout(() => {
    const mrtEl = document.querySelector('.loc-mrt-scroll-container');
    if (mrtEl) {
      mrtEl.scrollLeft = 0;
    }
  }, 10); // 10 毫秒極速防呆緩衝
}
  toggleStation(stationName: string): void {
    const index = this.selectedStations.indexOf(stationName);
    if (index > -1) {
      this.selectedStations.splice(index, 1);
    } else {
      this.selectedStations.push(stationName);
    }
  }

  isStationSelected(stationName: string): boolean {
    return this.selectedStations.includes(stationName);
  }

  // ==========================================
  // 5. 提交與關閉
  // ==========================================
  closeModal(): void {
    this.closeMarquee.emit();
  }

  clearAllFilters(): void {
    this.clearSubSelection();
    this.selectedRegion = '北部';
    this.selectedCityId = 'tw-tp';
    this.activeMrtLineId = 'line-br';

    this.regionApplied.emit({
      city: '',
      districts: [],
      stations: []
    });

    this.closeModal();
    console.log('🧹 地區篩選已全部重設還原');
  }

  submitFilter(): void {
    const currentCityObj = this.currentCities.find(c => c.id === this.selectedCityId);
    this.regionApplied.emit({
      city: currentCityObj ? currentCityObj.name : '',
      districts: this.selectedDistricts,
      stations: this.selectedStations
    });

    this.closeModal();
  }
}
