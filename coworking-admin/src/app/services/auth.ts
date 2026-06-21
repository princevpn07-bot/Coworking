import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginRequest, LoginResponse } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService
{
  private baseUrl = 'http://localhost:5193/api/Users';
  private apiurl = `${this.baseUrl}/Login`;
  private loggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient){}

  login(requst: LoginRequest): Observable<LoginResponse>
  {
    return this.http.post<LoginResponse>(this.apiurl, requst);
  };

  verifyOtp(email: string, otp: string): Observable<LoginResponse>
  {
    return this.http.post<LoginResponse>(`${this.baseUrl}/VerifyOtp`, { email, otp });
  };

  savetoken(token: string)
  {
    localStorage.setItem('token', token)
    this.loggedInSubject.next(true);
  }

  gettoken()
  {
    return localStorage.getItem('token');
  }

  logout()
  {
    localStorage.removeItem('token');
    this.loggedInSubject.next(false);
  }

  getrole()
  {
    const token = this.gettoken();
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return role;
  }

  getCurrentUserEmail(): string | null
  {
    const token = this.gettoken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['sub'] ?? null;
  }

  getUsername(): string
  {
    const token = this.gettoken();
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    const name =
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      payload['name'] ||
      payload['sub'] ||
      '';
    return name.includes('@') ? name.split('@')[0] : name;
  }

  getUserId(): number | null
  {
    const token = this.gettoken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const id = payload['user_id'];
    return id ? parseInt(id) : null;
  }

  getLocationId(): number | null
  {
    const token = this.gettoken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const id = payload['location_id'];
    return id ? parseInt(id) : null;
  }

  isAdmin(): boolean { return this.getrole() === '99'; }
  isStaff(): boolean { return this.getrole() === '80'; }
  isPartner(): boolean { return this.getrole() === '60'; }

  isLoggedIn(): boolean
  {
    return !!this.gettoken();
  }
}
