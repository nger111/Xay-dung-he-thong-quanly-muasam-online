import type { UserRole } from '@/types';

export const ROLES = {
  ADMIN: 'ADMIN',
  CHU_QUAN: 'CHU_QUAN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  NHAN_VIEN: 'NHAN_VIEN',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  CHU_QUAN: 'Chủ quán',
  MANAGER: 'Quản lý',
  CASHIER: 'Thu ngân',
  NHAN_VIEN: 'Nhân viên',
};

export const ADMIN_ROLES: UserRole[] = ['ADMIN', 'CHU_QUAN'];
export const MANAGER_ROLES: UserRole[] = ['ADMIN', 'CHU_QUAN', 'MANAGER'];
export const ALL_ROLES: UserRole[] = ['ADMIN', 'CHU_QUAN', 'MANAGER', 'CASHIER', 'NHAN_VIEN'];

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isManager(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role);
}
