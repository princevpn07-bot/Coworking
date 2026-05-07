export interface Space {
  space_id: number;
  location_id: number | null;
  space_number: string | null;
  capacity: number | null;
  status: number | null;
  image: string | null;
  has_wifi: boolean | null;
  has_whiteboard: boolean | null;
  has_projector: boolean | null;
  has_airconditioner: boolean | null;
  has_tables: boolean | null;
  has_chairs: boolean | null;
  has_windows: boolean | null;
  has_LCD: boolean | null;
  has_outlets: boolean | null;
  has_waterdispenser: boolean | null;
  has_restrooms: boolean | null;
}

export interface CreateSpace {
  location_id: number;
  space_number: string;
  capacity: number;
  status: number;
  image: string;
  has_wifi: boolean;
  has_whiteboard: boolean;
  has_projector: boolean;
  has_airconditioner: boolean;
  has_tables: boolean;
  has_chairs: boolean;
  has_windows: boolean;
  has_LCD: boolean;
  has_outlets: boolean;
  has_waterdispenser: boolean;
  has_restrooms: boolean;
}
