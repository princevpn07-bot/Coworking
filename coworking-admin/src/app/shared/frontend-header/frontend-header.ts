import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ProfileService } from '../../services/profile';
import { hasBackendAccess } from '../../models/role.model';

@Component({
  selector: 'app-frontend-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './frontend-header.html',
  styleUrl: './frontend-header.css',
})
export class FrontendHeader implements OnInit {
  isLoggedIn = false;
  username = '';
  showDropdown = false;
  avatarUrl = '';
  canLoginBackend = false;

  constructor(private auth: AuthService, private router: Router, private profileService: ProfileService) {}

  ngOnInit() {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.auth.getUsername();
      this.canLoginBackend = hasBackendAccess(this.auth.getrole());
      this.profileService.avatar$.subscribe(url => {
        this.avatarUrl = url;
      });

      // 🌟 2. 初始載入時主動撈取一次，確保還沒點進個人資料頁前也能在右上角顯示圖片
      this.profileService.getProfile().subscribe({
        next: (data: any) => {
          if (data && data.image) {
            this.profileService.updateAvatarStream(data.image);
          }
        },
        error: (err) => console.error('導覽列自動獲取頭貼失敗', err)
      });
    }
  }

  get avatarInitial(): string {
    return this.username ? this.username.charAt(0).toUpperCase() : '?';
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showDropdown = false;
    }
  }

  logout() {
    this.auth.logout();
    this.isLoggedIn = false;
    this.showDropdown = false;
    this.router.navigate(['/']);
  }
}
