import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FrontendHeader } from '../../../shared/frontend-header/frontend-header';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink, FrontendHeader],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  private apiUrl = 'http://localhost:5193/api/Users/Register';

  constructor(private http: HttpClient, private router: Router, private toast: ToastService) {}

  register() {
    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) {
      this.toast.warning('請填寫所有欄位');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.toast.error('兩次輸入的密碼不相同，請重新確認！');
      return;
    }

    this.http.post(this.apiUrl, {
      name: this.fullName,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.toast.success('註冊成功，請登入');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('註冊失敗', err);
        this.toast.error('註冊失敗，請稍後再試');
      },
    });
  }
}
