import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpaceDetailService, SpaceDetailDto } from '../../../services/space-detail.service';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-space-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './space-detail.html',
  styleUrl: './space-detail.css',

})

export class SpaceDetail {

  // =========================
  // inject
  // =========================
  private route = inject(ActivatedRoute);
  private spaceDetailService = inject(SpaceDetailService);

  constructor(private sanitizer: DomSanitizer) { }

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

  priceTypeMap: Record<string, string> = {
    '1': '每小時',
    '2': '每日',
    '3': '每月'
  };

  activeTab: 'intro' | 'amenities' | 'location' | 'review' = 'intro';

  setTab(tab: 'intro' | 'amenities' | 'location' | 'review') {
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

        this.mapUrl = data.location?.address
          ? this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.google.com/maps?q=${encodeURIComponent(data.location.address)}&output=embed`
          )
          : null;

        this.loading = false;

        console.log('space detail:', data);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
