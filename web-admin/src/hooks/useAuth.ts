import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import { hasRole, isAdmin, isManager } from '@/constants/roles';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();

  const checkRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return hasRole(user.role, allowedRoles);
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    isAdmin: user ? isAdmin(user.role) : false,
    isManager: user ? isManager(user.role) : false,
    checkRole,
  };
}
