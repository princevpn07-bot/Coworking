import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Space, CreateSpace, Location, AdminSpaceInfoDto, AdminSpaceAssertsDto } from '../models/space.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpaceService
{
  private apiurl = "http://localhost:5193/api/Spaces";
  private adminApiUrl = "http://localhost:5193/api/AdminSpaceManager";
  private locationApiUrl = "http://localhost:5193/api/Locations";

  constructor (private http: HttpClient){}

  getLocations(): Observable<Location[]>
  {
    return this.http.get<Location[]>(`${this.locationApiUrl}/GetAll`);
  }

  getall(): Observable<Space[]>
  {
    return this.http.get<Space[]>(this.apiurl + '/GetAll');
  }

  getspace(id: number): Observable<Space[]>
  {
    return this.http.get<Space[]>(this.apiurl + id);
  }

  createspace(space: CreateSpace): Observable<Space>
  {
    return this.http.post<Space>(this.apiurl + '/Add', space)
  }

  update(space: Space): Observable<void>
  {
    return this.http.put<void>(this.apiurl + '/Update', space);
  }

  delete(id: number): Observable<void>
  {
    return this.http.delete<void>(`this.apiurl + Delete/${id}`)
  }

  getSpaceInfo(): Observable<AdminSpaceInfoDto[]>
  {
    return this.http.get<AdminSpaceInfoDto[]>(`${this.adminApiUrl}/spaceinfo`);
  }

  getSpaceAssets(spaceId: number): Observable<AdminSpaceAssertsDto[]>
  {
    return this.http.get<AdminSpaceAssertsDto[]>(`${this.adminApiUrl}/assets/${spaceId}`);
  }
}
