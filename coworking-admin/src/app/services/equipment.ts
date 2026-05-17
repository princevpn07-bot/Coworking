import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminEquipmentCardDto, AdminSpaceAllocationDto, CreateEquipmentPayload } from '../models/equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private equipmentApiUrl    = 'http://localhost:5193/api/Equipments';
  private spaceAssertsApiUrl = 'http://localhost:5193/api/SpaceAsserts';

  constructor(private http: HttpClient) {}

  getEquipmentCards(): Observable<AdminEquipmentCardDto[]> {
    return this.http.get<AdminEquipmentCardDto[]>(`${this.equipmentApiUrl}/GetAllCards`);
  }

  getAllocationsByEquipment(equipment_id: number): Observable<AdminSpaceAllocationDto[]> {
    return this.http.get<AdminSpaceAllocationDto[]>(
      `${this.spaceAssertsApiUrl}/ByEquipment/${equipment_id}`
    );
  }

  addAllocation(space_id: number, equipment_id: number, amount: number): Observable<unknown> {
    return this.http.post(`${this.spaceAssertsApiUrl}/Add`, { space_id, equipment_id, amount });
  }

  updateAllocation(asserts_id: number, space_id: number, equipment_id: number, amount: number): Observable<unknown> {
    return this.http.put(`${this.spaceAssertsApiUrl}/Update`, { asserts_id, space_id, equipment_id, amount });
  }

  createEquipment(payload: CreateEquipmentPayload): Observable<unknown> {
    return this.http.post(`${this.equipmentApiUrl}/Add`, payload);
  }
}
