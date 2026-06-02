export interface Location {
  location_id: number;
  country: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  longitude: number | null;
  latitude: number | null;
  mrt_info: string | null;
}

export interface Space {
  space_id: number;
  location_id: number | null;
  space_number: string | null;
  capacity: number | null;
  status: number | null;
}

export interface CreateSpace {
  location_id: number;
  space_number: string;
  capacity: number;
  status: number;
}

export interface SpaceImageItem {
  id: number;
  space_id: number;
  image_path: string | null;
}

export type SpaceStatus = '可用' | '使用中' | '停用中' | '清潔中';

export interface SpaceAsset {
  assertsId: number;
  id: number;
  name: string;
  icon: string;
  amount: number;
}

export interface AdminSpaceAssertsDto {
  asserts_id: number;
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
  imagePath: string;
}

export interface AdminSpaceInfoDto {
  space_id: number;
  location_id: number | null;
  locationname: string | null;
  spacename: string | null;
  capacity: number | null;
  status: number | null;
  assetcount: number | null;
  imagePath: string | null;
}
