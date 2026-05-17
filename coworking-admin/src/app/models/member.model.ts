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
}

export interface MemberItem {
  userId: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
  totalBookings: number | null;
  status: boolean | null;
}
