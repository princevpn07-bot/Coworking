import { Component, OnInit, AfterViewInit, ViewEncapsulation, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../../services/location';
import { FormsModule } from '@angular/forms';
import { PriceFilter } from '../../../shared/price-filter/price-filter';
import { RegionFilterComponent } from '../../../shared/region-filter/region-filter.component';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatetimeFilter } from '../../../shared/datetime-filter/datetime-filter';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { NgZone } from '@angular/core';
import { FavoriteService } from '../../../services/favorite';

@Component({
  selector: 'app-all-spaces',
  standalone: true,
  imports: [CommonModule, FormsModule, PriceFilter, RegionFilterComponent, DatetimeFilter],
  templateUrl: './all-spaces.html',
  styleUrl: './all-spaces.css',
  encapsulation: ViewEncapsulation.None
})
export class AllSpaces implements OnInit, AfterViewInit {

  selectedSpaceId: number | null = null;
  selectedCity: string = '';
  // 宣告空間陣列
  spaces: any[] = [];

  // 💡 新增：用來完好保存從後端 API 撈出來的「最原始、未篩選」的數據快照
  allSpacesData: any[] = [];
  // 篩選變數
  selectedCapacity: number = 0;
  isCapacityOpen = false;
  selectCapacity(capacity: number) {
    this.selectedCapacity = capacity;
    this.isCapacityOpen = false;
    this.onSearch();
  }
  searchKeyword: string = '';

  // 選單開關狀態
  isPriceFilterOpen: boolean = false;
  isRegionFilterOpen: boolean = false;
  isDateTimeFilterOpen: boolean = false;
  // 💡 新增：儲存目前由子組件回傳的價格區間（預設為 0 ~ 100000）
  currentPriceRange = { min: 0, max: 100000 };
  // ------------------------------------------
  // 🗺️ 區域篩選相關變數（✨ 新增）
  // ------------------------------------------

  // 儲存目前由地區子組件回傳的勾選結果
  currentRegionRange = {
    city: '',
    districts: [] as string[],
    stations: [] as string[]
  };


  // 🌟 新增：控制時間彈窗的變數

  searchDate: string = '';
  searchStartTime: string = '';
  searchEndTime: string = '';


  map!: L.Map;
  markerLayer!: L.LayerGroup;
  earthIcon!: L.DivIcon;

  constructor(
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    public favoriteService: FavoriteService
  ) { }

  toggleFavorite(id: number, event: Event) {
    event.stopPropagation();
    this.favoriteService.toggleFavorite(id);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      this.currentPriceRange.min = p['minPrice'] != null ? Number(p['minPrice']) : 0;
      this.currentPriceRange.max = p['maxPrice'] != null ? Number(p['maxPrice']) : 100000;
      this.selectedCapacity = p['capacity'] ? Number(p['capacity']) : 0;
      this.currentRegionRange.city = p['city'] || '';
      this.searchKeyword = p['keyword'] || '';
      this.onSearch();
    });
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.map = L.map('map').setView([25.0478, 121.517], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(this.map);

      this.markerLayer = (L as any).markerClusterGroup({
        iconCreateFunction: (cluster: any) => {
          return L.divIcon({
            html: `<div class="cluster-inner">${cluster.getChildCount()}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(50, 50)
          });
        }
      });
      this.map.addLayer(this.markerLayer);
      (this.markerLayer as any).on(
        'clusterclick',
        (e: any) => {
          const markers =
            e.layer.getAllChildMarkers();
          if (!markers.length) return;
          const cityCount: Record<string, number> = {};
          markers.forEach((m: any) => {
            const city =
              m.spaceData?.city;
            if (!city) return;
            cityCount[city] =
              (cityCount[city] || 0) + 1;
          });
          const city =
            Object.entries(cityCount)
              .sort((a, b) => b[1] - a[1])[0]?.[0];
          if (!city) return;
          this.ngZone.run(() => {
            this.selectedCity = city;
            this.selectedSpaceId = null;
            this.prioritizeCity(city);
          });
        }
      );
      this.ngZone.run(() => this.renderMarkers());
    });
    this.earthIcon = L.divIcon({
      className: '',
      html: `
    <div style="
      width: 14px;
      height: 14px;
      background: #D8BBA2;
      border: 2px solid #A67C52;
      border-radius: 50%;
      box-shadow: 0 3px 6px rgba(0,0,0,0.15);
      position: relative;
    ">
      <div style="
        width: 6px;
        height: 6px;
        background: #F7F1EA;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      "></div>
    </div>
  `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  // 🌟 統一關閉所有選單
  private closeAllFilters(): void {
    this.isDateTimeFilterOpen = false;
    this.isPriceFilterOpen = false;
    this.isRegionFilterOpen = false;
  }

  // 🌟 點擊空白處自動關閉所有選單
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-group__item') &&
      !target.closest('.price-box-wrapper') &&
      !target.closest('.region-box-wrapper')) {
      this.closeAllFilters();
    }
  }

  // --- 選單開啟方法 ---
  openDateTimeFilter(): void {
    const state = this.isDateTimeFilterOpen;
    this.closeAllFilters();
    this.isDateTimeFilterOpen = !state;
  }

  openFilter(): void {
    const state = this.isPriceFilterOpen;
    this.closeAllFilters();
    this.isPriceFilterOpen = !state;
  }

  openRegionFilter(): void {
    const state = this.isRegionFilterOpen;
    this.closeAllFilters();
    this.isRegionFilterOpen = !state;
  }

  // --- 事件處理 ---
  onDateTimeFilterApplied(result: { date: string; startTime: string; endTime: string }): void {
    this.searchDate = result.date;
    this.searchStartTime = result.startTime;
    this.searchEndTime = result.endTime;
    // 🌟 核心修正：選完時間後，不再只做前端過濾，而是直接重新 call API
    this.onSearch();
    this.isDateTimeFilterOpen = false;
  }

  onPriceFilterApplied(budget: { min: number; max: number }): void {
    this.currentPriceRange = budget;
    this.applyFrontendFilters();
    this.isPriceFilterOpen = false;
  }

  onRegionFilterApplied(regionData: { city: string; districts: string[]; stations: string[] }): void {
    this.currentRegionRange = regionData;
    this.applyFrontendFilters();
    this.isRegionFilterOpen = false;
  }

  loadSpacesFromDb(keyword?: string, capacity?: number): void {
    // 1. 處理日期格式
    let formattedDate = undefined;
    if (this.searchDate) {
      // 由於我們 UI 可能會傳 "2026/06/14 至 2026/06/16" 這種區間
      // 目前 C# API 只接收單一日期，所以我們先擷取前面的第一天，並將 / 換成 -
      const firstDate = this.searchDate.split(' ')[0];
      formattedDate = firstDate.replace(/\//g, '-'); // 變成 "2026-06-14"
    }

    // 2. 處理時間變數
    const start = this.searchStartTime || undefined;
    const end = this.searchEndTime || undefined;

    this.locationService.getFrontendSpaces(keyword, capacity, formattedDate, start, end).subscribe({
      next: (data: any[]) => {
        this.allSpacesData = data.map(item => ({
          id: item.space_id || item.id,
          name: `${item.city || '共享空間'} · ${item.space_number || ''}`,
          price: item.price || 15000,
          capacity: `${item.capacity || 0}人`,
          location: item.mrt_info || '捷運站步行可達',
          img: item.image_path ? `http://localhost:5193${item.image_path}` : 'assets/Featured_space_01.png',
          latitude: item.latitude,
          longitude: item.longitude,
          city: item.city || '',
          dbAddress: item.address || ''
        }));
        this.applyFrontendFilters();
      }
    });
  }

  applyFrontendFilters(): void {
    const filterMin = Number(this.currentPriceRange.min);
    const filterMax = Number(this.currentPriceRange.max);

    this.spaces = this.allSpacesData.filter((space) => {
      const spacePrice = Number(space.price);
      const matchesPrice = spacePrice >= filterMin && spacePrice <= filterMax;

      const fullAddressText = (space.name || '') + (space.location || '') + (space.dbAddress || '');
      const matchesCity = !this.currentRegionRange.city || fullAddressText.includes(this.currentRegionRange.city);
      const matchesDistrict = this.currentRegionRange.districts.length === 0 ||
        this.currentRegionRange.districts.some(dist => fullAddressText.includes(dist));
      const matchesMrt = this.currentRegionRange.stations.length === 0 ||
        this.currentRegionRange.stations.some(station => (space.location || '').includes(station));

      return matchesPrice && matchesCity && matchesDistrict && matchesMrt;
    });
    this.cdr.detectChanges();
    this.renderMarkers();
  }

  onSearch(): void {
    // 統一從這裡把所有的搜尋條件傳給 loadSpacesFromDb
    this.loadSpacesFromDb(
      this.searchKeyword.trim() || undefined,
      this.selectedCapacity > 0 ? this.selectedCapacity : undefined);
  }

  renderMarkers(): void {
    if (!this.map) return;
    this.markerLayer.clearLayers();
    const bounds = L.latLngBounds([]);
    this.spaces.forEach(space => {
      if (space.latitude == null || space.longitude == null) return;
      const latlng: L.LatLngExpression = [space.latitude, space.longitude];
      bounds.extend(latlng);

      const marker = L.marker(latlng, {
        icon: this.earthIcon, riseOnHover: true
      }).bindPopup(`
        <div class="map-popup">
          <div class="map-popup__title">${space.name}</div>
          <div class="map-popup__price">NT$ ${space.price} / 小時起</div>
        </div>
      `);
      (marker as any).spaceData = space;
      marker.on('click', () => {
        this.ngZone.run(() => {
          this.selectedCity = space.city;
          this.selectedSpaceId = space.id;
          this.prioritizeCity(space.city);
          setTimeout(() => {
            const card = document.getElementById(
              `space-card-${space.id}`
            );
            card?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }, 100);
        });
      });
      this.markerLayer.addLayer(marker);
    });
    if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  prioritizeCity(city: string): void {
    const matched =
      this.spaces.filter(x => x.city === city);
    const others =
      this.spaces.filter(x => x.city !== city);
    this.spaces = [
      ...matched,
      ...others
    ];
    this.cdr.detectChanges();
    setTimeout(() => {
      const feed = document.querySelector(
        '.listing-section__feed'
      );

    });
  }

  goToSpaceDetail(spaceId: any): void {
    this.ngZone.run(() => {
      this.router.navigate(['/space-detail', spaceId]);
    });
  }
}
