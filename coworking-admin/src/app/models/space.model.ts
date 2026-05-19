export interface Location {
  location_id: number;
  country: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  longitude: number | null;
  latitude: number | null;
}

export interface Space {
  space_id: number;
  location_id: number | null;
  space_number: string | null;
  capacity: number | null;
  status: number | null;
  image: string | null;
}

export interface CreateSpace {
  location_id: number;
  space_number: string;
  capacity: number;
  status: number;
  image: string;
}

export type SpaceStatus = '可用' | '使用中' | '停用中' | '清潔中';

export interface SpaceAsset {
  id: number;
  name: string;
  icon: string;
  amount: number;
}

export interface AdminSpaceAssertsDto {
  equipment_id: number;
  equipmentname: string | null;
  amount: number | null;
}

export interface SpaceView {
  id: number;
  locationId: number;
  name: string;
  location: string;
  capacity: number;
  status: SpaceStatus;
  assetCount: number;
  image: string;
}

export interface AdminSpaceInfoDto {
  space_id: number;
  location_id: number | null;
  locationname: string | null;
  spacename: string | null;
  capacity: number | null;
  status: number | null;
  assetcount: number | null;
  image: string | null;
}
