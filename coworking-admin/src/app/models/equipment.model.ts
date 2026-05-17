export interface CreateEquipmentPayload {
  location_id: number | null;
  category: string;
  full_name: string;
  create_date: string;
  cost: number;
  total_amount: number;
}

export interface AdminSpaceAllocationDto {
  asserts_id: number;
  space_id: number;
  space_name: string | null;
  amount: number;
}

export interface AdminEquipmentCardDto {
  equipment_id: number;
  category: string | null;
  full_name: string | null;
  create_date: string | null;
  total_amount: number | null;
  location_name: string | null;
  is_precious: boolean;
  allocations: AdminSpaceAllocationDto[];
}
