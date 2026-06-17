export interface UserProfile {
  name: string | null;
  email: string | null;
  role: number | null;
  phone: string | null;
  image: string | null;
  lineId: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
