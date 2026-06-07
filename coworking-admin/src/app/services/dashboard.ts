import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary, ExpiringContract, PendingPayment } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = 'http://localhost:5193/api/AdminDashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  getExpiringContracts(): Observable<ExpiringContract[]> {
    return this.http.get<ExpiringContract[]>(`${this.apiUrl}/expiring`);
  }

  getPendingPayments(): Observable<PendingPayment[]> {
    return this.http.get<PendingPayment[]>(`${this.apiUrl}/pending`);
  }
}
