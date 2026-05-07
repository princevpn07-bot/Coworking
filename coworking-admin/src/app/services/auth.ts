import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginRequest, LoginResponse } from '../models/user.model';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AuthService
{
  private apiurl = 'http://localhost:5193/api/Users/Login';

  constructor(private http: HttpClient){}

  login(requst: LoginRequest): Observable<LoginResponse>
  {
    return this.http.post<LoginResponse>(this.apiurl, requst);
  };

  savetoken(token: string)
  {
    localStorage.setItem('token', token)
  }

  gettoken()
  {
    return localStorage.getItem('token');
  }

  logout()
  {
    localStorage.removeItem('token');
  }

  getrole()
  {
    const token = this.gettoken();
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return role;
  }

}
