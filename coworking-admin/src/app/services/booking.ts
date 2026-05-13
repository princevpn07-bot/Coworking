import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Booking, BookingDetail, UserOption, RentOption, EmployeeOption, CreateBookingPayload } from '../models/booking.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'http://localhost:5193/api/AdminBookingList';
  private baseUrl = 'http://localhost:5193/api';

  constructor(private http: HttpClient) {}

  getCalendar(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl + '/calendar');
  }

  getDetails(date: Date): Observable<BookingDetail[]> {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return this.http.get<BookingDetail[]>(`${this.apiUrl}/details?date=${dateStr}`);
  }

  getUsers(): Observable<UserOption[]> {
    return this.http.get<UserOption[]>(`${this.baseUrl}/Users/GetAll`);
  }

  getRents(): Observable<RentOption[]> {
    return this.http.get<RentOption[]>(`${this.baseUrl}/Rents/GetAll`);
  }

  getEmployees(): Observable<EmployeeOption[]> {
    return this.http.get<EmployeeOption[]>(`${this.baseUrl}/Employees/GetAll`);
  }

  updateStatus(contractId: number, status: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${contractId}/status`, status);
  }

  createBooking(payload: CreateBookingPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/add`, payload);
  }
}
