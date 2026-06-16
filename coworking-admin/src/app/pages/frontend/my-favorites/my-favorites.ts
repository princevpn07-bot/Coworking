import { Component } from '@angular/core';
import { FavoriteService } from '../../../services/favorite';
import { LocationService } from '../../../services/location'; 
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-my-favorites',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './my-favorites.html',
  styleUrl: './my-favorites.css',
})
export class MyFavorites {

  favorites: any[] = []; 

  constructor(
    public favoriteService: FavoriteService,
    private locationService: LocationService, 
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    combineLatest([
      this.locationService.getFrontendSpaces(), 
      this.favoriteService.favorites$
    ])
      .subscribe(([spaces, ids]: [any[], any[]]) => {

        const favoritedRaw = spaces.filter(space =>
          ids.includes(space.space_id || space.id)
        );

        this.favorites = favoritedRaw.map((item: any) => ({
          id: item.space_id || item.id,
          // 💡 拆分欄位：中文名稱與英文編號分開，方便前端做極致對齊
          displayName: item.space_name || item.city || '共享空間',
          spaceNumber: item.space_number || '',
          price: item.price || 0,
          capacity: item.capacity || 0,
          location: item.mrt_info || '捷運站步行可達',
          img: item.image_path ? `http://localhost:5193${item.image_path}` : 'assets/Featured_space_01.png'
        }));

        this.cdr.detectChanges();
      });
  }

  removeFavorite(spaceId: number) {
    this.favoriteService.toggleFavorite(spaceId);
  }

}