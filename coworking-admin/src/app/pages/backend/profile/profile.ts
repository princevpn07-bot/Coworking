import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../services/profile';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private profileService = inject(ProfileService);

  name = '';
  email = '';
  role: number | null = null;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly saveSuccess = signal(false);

  private originalName = '';

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.name = data.name ?? '';
        this.email = data.email ?? '';
        this.role = data.role ?? null;
        this.originalName = this.name;
      },
      error: () => this.saveError.set('無法載入個人資料'),
    });
  }

  get avatarInitial(): string {
    return this.name ? this.name.charAt(0) : '?';
  }

  get roleLabel(): string {
    if (this.role === 99) return '企業管理員';
    if (this.role === 80) return '員工';
    return '客戶';
  }

  private validatePassword(password: string): string {
    if (password.length < 6) return '密碼至少需要 6 位';
    if (!/[a-z]/.test(password)) return '密碼需包含小寫字母';
    if (!/[A-Z]/.test(password)) return '密碼需包含大寫字母';
    if (!/[^a-zA-Z0-9]/.test(password)) return '密碼需包含特殊符號（如 !@#$%）';
    return '';
  }

  cancel(): void {
    this.name = this.originalName;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.saveError.set('');
    this.saveSuccess.set(false);
  }

  save(): void {
    this.saveError.set('');
    this.saveSuccess.set(false);

    const hasPasswordChange = this.newPassword.length > 0 || this.currentPassword.length > 0;

    if (hasPasswordChange) {
      if (!this.currentPassword) { this.saveError.set('請輸入當前密碼'); return; }
      const pwdError = this.validatePassword(this.newPassword);
      if (pwdError) { this.saveError.set(pwdError); return; }
      if (this.newPassword !== this.confirmPassword) { this.saveError.set('兩次輸入的新密碼不一致'); return; }
    }

    this.saving.set(true);

    this.profileService.updateName(this.name).subscribe({
      next: () => {
        this.originalName = this.name;
        if (!hasPasswordChange) {
          this.saving.set(false);
          this.saveSuccess.set(true);
          return;
        }
        this.profileService.changePassword({
          currentPassword: this.currentPassword,
          newPassword: this.newPassword,
        }).subscribe({
          next: () => {
            this.saving.set(false);
            this.saveSuccess.set(true);
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
          },
          error: (err) => {
            this.saving.set(false);
            this.saveError.set(err?.error ?? '密碼更新失敗');
          },
        });
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('姓名更新失敗');
      },
    });
  }
}
