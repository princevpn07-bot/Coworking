import { Component ,OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginRequest } from '../../../models/user.model';
import { AuthService } from '../../../services/auth';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { hasBackendAccess } from '../../../models/role.model';
import { FrontendHeader } from '../../../shared/frontend-header/frontend-header';
import { ProfileService } from '../../../services/profile';
import { ToastService } from '../../../services/toast';
// @ts-ignore
import { startLoginSatinEffect } from './login-satin.effect.js';
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, FrontendHeader],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login
{
  credentials: LoginRequest = { email: '', password: '' };
  step = 1;
  pendingEmail = '';
  otp = '';
  isSending = false;
  returnUrl: string = '/';
// 🎯 獲取全域登入大容器參考，用來提供給 JS 特效引擎進行節點追蹤
  @ViewChild('loginContainer') loginContainerRef!: ElementRef<HTMLElement>;
  private satinEngine?: { destroy: () => void };
  constructor(
    private authservices: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private toast: ToastService,
    private zone: NgZone
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
ngOnInit() {}

  // 🎯 當畫面 DOM 節點加載完全時，安全活化 JS 特效
  ngAfterViewInit() {
    this.activateEffect();
  }

  private activateEffect() {
    const container = this.loginContainerRef?.nativeElement;
    if (container) {
      // 如果已有舊引擎執行中，先釋放以確保乾淨
      if (this.satinEngine) this.satinEngine.destroy();
      this.satinEngine = startLoginSatinEffect(container, this.zone);
    }
  }
  login()
  {
    this.authservices.login(this.credentials).subscribe({
      next: (response) =>
      {
        if (response.require2fa)
        {
          this.pendingEmail = this.credentials.email;
          this.step = 2;
        }
        else
        {
          this.onLoginSuccess(response.token);
        }
      },
      error: () => this.toast.error('帳號或密碼錯誤')
    });
  }

  verifyOtp()
  {
    this.authservices.verifyOtp(this.pendingEmail, this.otp).subscribe({
      next: (response) => this.onLoginSuccess(response.token),
      error: (err) =>
      {
        if (err.status === 400) this.toast.error('驗證碼已過期，請重新登入');
        else this.toast.error('驗證碼錯誤，請再試一次');
      }
    });
  }

  resendOtp()
  {
    if (this.isSending) return;
    this.isSending = true;
    this.authservices.login(this.credentials).subscribe({
      next: () => { this.otp = ''; this.isSending = false; this.toast.success('驗證碼已重新發送！'); },
      error: () => { this.isSending = false; }
    });
  }

  backToLogin()
  {
    this.step = 1;
    this.otp = '';
    // 返回登入時，同步重燃動畫
    setTimeout(() => { this.activateEffect(); }, 50);
  }

  private onLoginSuccess(token: string)
  {
    this.profileService.clearStreams();
    this.authservices.savetoken(token);
    const role = this.authservices.getrole();
    if (hasBackendAccess(role)) this.router.navigate(['/backend/dashboard']);
    else this.router.navigate([this.returnUrl]);
  }

// 🎯 當頁面切換或組件被銷毀時，安全回收滑鼠監聽，杜絕記憶體洩漏
  ngOnDestroy() {
    if (this.satinEngine) {
      this.satinEngine.destroy();
    }
  }
}