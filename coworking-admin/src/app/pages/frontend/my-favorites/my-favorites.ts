import { Component } from '@angular/core';
import { FavoriteService } from '../../../services/favorite';
import { SpaceService } from '../../../services/space';
import { Space } from '../../../models/space.model';
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

  favorites: Space[] = [];

  constructor(
    public favoriteService: FavoriteService,
    private spaceService: SpaceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    combineLatest([
      this.spaceService.getall(),
      this.favoriteService.favorites$
    ])
      .subscribe(([spaces, ids]) => {

        this.favorites = spaces.filter(space =>
          ids.includes(space.space_id)
        );

        this.cdr.detectChanges();
      });

  }

  removeFavorite(spaceId: number) {
    this.favoriteService.toggleFavorite(spaceId);
  }

}
