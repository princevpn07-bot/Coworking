export interface UserProfile {
  name: string | null;
  email: string | null;
  role: number | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
