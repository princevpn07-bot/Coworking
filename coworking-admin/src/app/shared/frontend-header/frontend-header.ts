import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ProfileService } from '../../services/profile';
import { hasBackendAccess } from '../../models/role.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators'; 

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

  // ✨ 建立一個用來通知解除訂閱的控制閥
  private destroy$ = new Subject<void>();

  constructor(private auth: AuthService, private router: Router, private profileService: ProfileService) {}

  ngOnInit() {
   // ✨ 1. 追蹤大頭貼廣播 (加上生命週期管控)
    this.profileService.avatar$
      .pipe(takeUntil(this.destroy$))
      .subscribe(url => {
        this.avatarUrl = url;
      });

    // ✨ 2. 追蹤名字廣播 (加上生命週期管控，並處理空值清空邏輯)
    this.profileService.name$
      .pipe(takeUntil(this.destroy$))
      .subscribe(name => {
        if (name) {
          this.username = name;
        } else {
          this.username = ''; // 當清除快取時，名字也要立刻洗白
        }
      });

    // ✨ 3. 響應式監聽全站登入與登出狀態切換
    this.auth.loggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoggedIn => {
        this.isLoggedIn = isLoggedIn;

        if (isLoggedIn) {
          // ======= 【當有人登入時】 =======
          this.username = this.auth.getUsername(); // 先拿新 Token 裡的名字墊底
          this.canLoginBackend = hasBackendAccess(this.auth.getrole());

          // 主動向後端撈取該新使用者的最新資料庫個資
          this.profileService.getProfile()
            .pipe(takeUntil(this.destroy$)) // ✨ 核心關鍵：若 Header 銷毀，此未完成的請求回傳時會直接被無視，拒絕污染新帳號
            .subscribe({
              next: (data: any) => {
                if (data) {
                  // 廣播這隻新帳號專屬的真實姓名與頭貼給導覽列
                  if (data.name) this.profileService.updateNameStream(data.name);
                  if (data.image) this.profileService.updateAvatarStream(data.image);
                }
              },
              error: (err) => console.error('導覽列自動獲取頭貼與名字失敗', err)
            });
        } else {
          // ======= 【當有人登出時】 =======
          this.username = '';
          this.avatarUrl = '';
          this.canLoginBackend = false;
          this.profileService.clearStreams(); 
        }
      });
  }
  // ✨ 當 Header 元件因換頁而銷毀時，主動切斷所有追蹤與還在跑的 HTTP 請求
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.auth.logout(); // 執行後會觸發 auth.loggedIn$ 發射 false，進而跑進上面第 43 行的登出洗白邏輯
    this.showDropdown = false;
    this.router.navigate(['/']);
  }
}