import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile, ChangePasswordPayload } from '../models/profile.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = 'http://localhost:5193/api/AdminProfile';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.gettoken()}` });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`, { headers: this.authHeaders() });
  }

  updateName(name: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/updatename`, { name }, { headers: this.authHeaders() });
  }

  changePassword(payload: ChangePasswordPayload): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/changepassword`, payload, { headers: this.authHeaders() });
  }
}
