import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginRequest } from '../../../models/user.model';
import { AuthService } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { hasBackendAccess } from '../../../models/role.model';
import { FrontendHeader } from '../../../shared/frontend-header/frontend-header';
import { ProfileService } from '../../../services/profile';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, FrontendHeader],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login
{
  credentials : LoginRequest =
  {
    email: '',
    password: ''
  };

  

  constructor(private authservices: AuthService, 
              private router: Router,
              private profileService: ProfileService
  ){}

  login()
  {
    this.authservices.login(this.credentials).subscribe(
      {
        next: (response) =>
        {
          // ✨ 3. 關鍵修復：登入成功時，立刻清空舊快取串流，確保新頁面不會閃現舊名字
          this.profileService.clearStreams();
          this.authservices.savetoken(response.token);
          const role = this.authservices.getrole();
          if (hasBackendAccess(role))
          {
            this.router.navigate(['/backend/dashboard']);
          }
          else
          {
            this.router.navigate(['/']);
          }
        },
        error: (err) =>
          {
            console.log('登入失敗', err)
            alert('帳號或密碼錯誤')
          }
      })
  }
}
