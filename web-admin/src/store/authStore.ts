import { create } from 'zustand';
import type { User } from '@/types';
import { getToken, setToken, clearAuth, getStoredUser, setStoredUser } from '@/utils/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token: string, user: User) => {
    setToken(token);
    setStoredUser(user);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    clearAuth();
    set({ token: null, user: null, isAuthenticated: false });
  },

  initialize: () => {
    const token = getToken();
    const user = getStoredUser() as User | null;
    if (token && user) {
      set({ token, user, isAuthenticated: true });
    }
  },
}));
