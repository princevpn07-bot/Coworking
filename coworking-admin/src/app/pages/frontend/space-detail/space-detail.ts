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
  lowestPrice = 0;
  mapUrl: SafeResourceUrl | null = null;
  topEquipments: SpaceDetailDto['equipments'] = [];
  galleryImages: any[] = [];

  priceTypeMap: Record<number, string> = {
    1: '時租',
    2: '日租',
    3: '月租'
  };

  // =========================
  // lifecycle
  // =========================
  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));


    if (isNaN(id)) {
      console.error('space id 無效');
      this.loading = false;
      return;
    }

    this.spaceDetailService.getSpaceDetail(id).subscribe({
      next: (data) => {

        this.space = data;


        // =========================
        // 1. 最低價格（一次算好）
        // =========================
        this.lowestPrice = data.rents?.length
          ? Math.min(...data.rents.map(r => r.price))
          : 0;

        // =========================
        // 2. Google Map URL（只算一次）
        // =========================
        if (data.location?.address) {
          this.mapUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(
              `https://www.google.com/maps?q=${encodeURIComponent(
                data.location.address
              )}&output=embed`
            );
        }

        this.galleryImages = data.images ?? [];
        this.topEquipments = data.equipments.slice(0, 4);

        this.loading = false;

        console.log('space detail:', data);
      },
      error: (err) => {
        console.error('取得空間詳細失敗', err);
        this.loading = false;
      }
    });
  }
}
