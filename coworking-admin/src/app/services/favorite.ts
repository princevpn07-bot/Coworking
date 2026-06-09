import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class FavoriteService {

   private readonly STORAGE_KEY = 'favorites';

  private favoritesSubject = new BehaviorSubject<number[]>(
    this.loadFromStorage()
  );

  favorites$ = this.favoritesSubject.asObservable();

  constructor() {}

  // 🔥 初始化 localStorage
  private loadFromStorage(): number[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  private saveToStorage(ids: number[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
  }

  // 🔥 toggle（唯一寫入入口）
  toggleFavorite(spaceId: number): void {

    const current = this.favoritesSubject.value;

    const updated = current.includes(spaceId)
      ? current.filter(id => id !== spaceId)
      : [...current, spaceId];

    this.favoritesSubject.next(updated);
    this.saveToStorage(updated);
  }

  // 🔥 查詢（UI用）
  isFavorite(spaceId: number): boolean {
    return this.favoritesSubject.value.includes(spaceId);
  }

  // 🔥 取得快照（只用於 debug）
  getFavorites(): number[] {
    return this.favoritesSubject.value;
  }


}
