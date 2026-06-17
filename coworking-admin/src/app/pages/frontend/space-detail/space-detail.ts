import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpaceDetailService, SpaceDetailDto } from '../../../services/space-detail.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FavoriteService } from '../../../services/favorite';

@Component({
  selector: 'app-space-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './space-detail.html',
  styleUrl: './space-detail.css',

})

export class SpaceDetail implements OnInit {

  // =========================
  // inject
  // =========================
  private route = inject(ActivatedRoute);
  private spaceDetailService = inject(SpaceDetailService);
  private cdr = inject(ChangeDetectorRef);


  constructor(
    private sanitizer: DomSanitizer,
    public favoriteService: FavoriteService,
    private router: Router
  ) { }
  toggleFavorite(spaceId: number, event: Event) {
    event.stopPropagation();
    this.favoriteService.toggleFavorite(spaceId);
  }

  showShareModal = false;
  showCopySuccessToast = false;
  shareUrl = window.location.href;
  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.shareUrl);

      this.showShareModal = false;

      // 如果要再跳成功視窗
      this.showCopySuccessToast = true;

    } catch (error) {
      console.error(error);
    }
  }


  // =========================
  // state
  // =========================
  space: SpaceDetailDto | null = null;
  loading = true;

  imgBaseUrl = 'http://localhost:5193/';


  // ✔ precomputed values（取代 template function）
  mainImage: string = '';
  galleryImages: any[] = [];
  galleryThumbs: any[] = [];
  equipments: any[] = [];
  mapUrl: SafeResourceUrl | null = null;
  lowestPrice: number = 0;
  selectedRent: any = null;

  selectRent(rent: any) {
    this.selectedRent = rent;
  }

  priceTypeMap: Record<string, string> = {
    '1': '每小時',
    '2': '每日',
    '3': '每月'
  };

  activeTab: 'intro' | 'amenities' | 'location' | 'notice' | 'review' = 'intro';

  setTab(tab: 'intro' | 'amenities' | 'location' | 'notice' | 'review') {
    this.activeTab = tab;
  }

  // =========================
  // lifecycle
  // =========================
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.spaceDetailService.getSpaceDetail(id).subscribe({
      next: (data) => {

        this.space = data;

        // ✅ 安全預處理（全部避免 template 做運算）
        this.galleryImages = data.images ?? [];

        this.mainImage = this.galleryImages[0]?.imagePath
          ? this.imgBaseUrl + this.galleryImages[0].imagePath
          : 'assets/no-image.png';

        this.galleryThumbs = this.galleryImages.slice(1).map(img => ({
          ...img,
          fullUrl: this.imgBaseUrl + img.imagePath
        }));

        this.equipments = data.equipments ?? [];

        this.lowestPrice = data.rents?.length
          ? Math.min(...data.rents.map(r => r.price))
          : 0;

        this.selectedRent = data.rents?.[0] ?? null;

        this.mapUrl = data.location?.address
          ? this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.google.com/maps?q=${encodeURIComponent(data.location.address)}&output=embed`
          )
          : null;

        this.loading = false;
        this.cdr.detectChanges();

        console.log('space detail:', data);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }

    });

  }

  goBooking(): void {
    if (!this.space) {
      alert("空間選擇，請重新選擇");
      return;
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        spaceId: this.space.spaceId
      }
    });
  }

}
