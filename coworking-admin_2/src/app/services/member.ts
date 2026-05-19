import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserPayload, MemberPageData } from '../models/member.model';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private apiUrl = 'http://localhost:5193/api/AdminMemberManagement';

  constructor(private http: HttpClient) {}

  getMemberPage(): Observable<MemberPageData> {
    return this.http.get<MemberPageData>(`${this.apiUrl}/memberpage`);
  }

  createUser(payload: CreateUserPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/createuser`, payload);
  }

  updateRole(userId: number, role: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/updaterole/${userId}/${role}`, {});
  }

  resetPassword(userId: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/resetpassword/${userId}`, {});
  }

  toggleBlock(userId: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/toggleblock/${userId}`, {});
  }
}
