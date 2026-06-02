import { Component,inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpaceDetailService,SpaceDetailDto } from '../../../services/space-detail.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-space-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './space-detail.html',
  styleUrl: './space-detail.css',
})
export class SpaceDetail {
  private route = inject(ActivatedRoute);
  private spaceDetailService = inject(SpaceDetailService);

  space: SpaceDetailDto | null = null;
  loading = true;

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.spaceDetailService.getSpaceDetail(id).subscribe({
      next: (data) => {
        this.space = data;
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
