import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginRequest } from '../../../models/user.model';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { Role } from '../../../models/role.model';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
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

  constructor(private authservices: AuthService, private router: Router){}

  login()
  {
    this.authservices.login(this.credentials).subscribe(
      {
        next: (response) =>
        {
          this.authservices.savetoken(response.token);
          const role = this.authservices.getrole();
          if (role == Role.Admin || role == Role.Staff)
          {
            this.router.navigate(['/backend/spaces']);
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
