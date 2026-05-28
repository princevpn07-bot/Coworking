import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { Location } from '../models/space.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiurl = 'http://localhost:5193/api/FrontendLocation'; // 依照你的環境可能需要加上 http://localhost:xxxx

  constructor(private http: HttpClient) { }


  /* getLocations(): Observable<Location[]> {
     return this.http.get<Location[]>(this.apiUrl);
   /**
    * 🌟 呼叫後端全新三表聯查 DTO 的 API
    */
  getFrontendSpaces(keyword?: string, capacity?: number): Observable<any[]> {
    const url = keyword
      ? `${this.apiurl}/GetFrontendSpaces?keyword=${encodeURIComponent(keyword)}`
      : `${this.apiurl}/GetFrontendSpaces`;
    let params = new HttpParams();

    // 如果有傳關鍵字，就幫網址組合上 ?keyword=xxx
    if (keyword) {
      params = params.set('keyword', keyword);
    }
    // 如果有傳人數容量，也一併加入參數
    if (capacity !== undefined) {
      params = params.set('capacity', capacity.toString());
    }
    return this.http.get<any[]>(`${this.apiurl}/GetFrontendSpaces`, { params });
  }
  // 🔹 新增：根據價格區間向後端撈取空間資料
  getSpacesByPrice(minPrice: number, maxPrice: number): Observable<any[]> {
    let params = new HttpParams()
      .set('minPrice', minPrice.toString())
      .set('maxPrice', maxPrice.toString());

    // 呼叫後端 API，例如：http://localhost:5193/api/FrontendLocation/GetSpacesByPrice
    return this.http.get<any[]>(`${this.apiurl}/GetSpacesByPrice`, { params });
  }
}
