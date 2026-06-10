export enum Role {
  Employee = '10',
  Company = '20',
  Partner = '60',
  Staff = '80',
  Admin = '99'
}

export const BACKEND_ROLES: ReadonlySet<string> = new Set([
  Role.Partner,
  Role.Staff,
  Role.Admin,
]);

export function hasBackendAccess(role: string | null): boolean {
  return role != null && BACKEND_ROLES.has(role);
}
