export interface MemberPageData {
  totalMembers: number | null;
  activeBookingUsers: number | null;
  suspendedCount: number | null;
  memberList: MemberItem[] | null;
  total: number | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: number;
  department?: string;
  jobTitle?: string;
  locationId?: number;
  birth?: string;
  partnerCity?: string;
  partnerAddress?: string;
  partnerPhone?: string;
  partnerMrtInfo?: string;
}

export interface MemberItem {
  userId: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
  totalBookings: number | null;
  status: boolean | null;
  lineId: string | null;
}

export interface UpdateRolePayload {
  department?: string;
  jobTitle?: string;
  locationId?: number;
  birth?: string;
  partnerCity?: string;
  partnerAddress?: string;
  partnerPhone?: string;
  partnerMrtInfo?: string;
}

export interface LocationOption {
  location_id: number;
  city: string | null;
  address: string | null;
}
