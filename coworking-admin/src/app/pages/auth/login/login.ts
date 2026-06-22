import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginRequest } from '../../../models/user.model';
import { AuthService } from '../../../services/auth';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { hasBackendAccess } from '../../../models/role.model';
import { FrontendHeader } from '../../../shared/frontend-header/frontend-header';
import { ProfileService } from '../../../services/profile';
import { ToastService } from '../../../services/toast';

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

  constructor(
    private authservices: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private toast: ToastService
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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
  }

  private onLoginSuccess(token: string)
  {
    this.profileService.clearStreams();
    this.authservices.savetoken(token);
    const role = this.authservices.getrole();
    if (hasBackendAccess(role)) this.router.navigate(['/backend/dashboard']);
    else this.router.navigate([this.returnUrl]);
  }
}
