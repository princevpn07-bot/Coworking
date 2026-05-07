import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Space, CreateSpace } from '../models/space.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpaceService
{
  private apiurl = "http://localhost:5193/api/Spaces";

  constructor (private http: HttpClient){}

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
}
