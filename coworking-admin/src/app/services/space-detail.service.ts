import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SpaceDetailDto {
  spaceId: number;
  spaceNumber: string;
  capacity: number;
  status: number;
  introduction: string | null;

  location: {
    country: string;
    city: string;
    address: string;
    phone: string;
    mrtInfo: string;
  };

  images: {
    id: number;
    imagePath: string;
  }[];

  equipments: any[];
  rents: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SpaceDetailService {

  private apiUrl = 'http://localhost:5193/api/FrontendSpaceDetail';

  constructor(private http: HttpClient) {}

  getSpaceDetail(id: number): Observable<SpaceDetailDto> {
    return this.http.get<SpaceDetailDto>(`${this.apiUrl}/${id}`);
  }
}
