import { create } from 'zustand';
import { storage } from '../services/storage';
import { authAPI, TOKEN_KEY, unwrapData } from '../services/api';
import { useCartStore } from './cartStore';

export interface User {
  id: string;
  username: string;
  full_name: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

const normalizeUser = (value: unknown): User => {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    username: String(raw.username ?? ''),
    full_name: String(raw.full_name ?? raw.fullName ?? ''),
    fullName: String(raw.full_name ?? raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    role: String(raw.role ?? '').toUpperCase(),
  };
};

const readUser = (response: unknown): User =>
  normalizeUser(unwrapData<{ user?: unknown }>(response).user ?? unwrapData(response));

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || fallback;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) {
        set({ isAuthenticated: false, user: null, token: null, isLoading: false });
        return;
      }

      const response = await authAPI.me();
      const user = readUser(response.data);
      set({ isAuthenticated: true, user, token, isLoading: false });
    } catch (error) {
      await storage.deleteItem(TOKEN_KEY);
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: getErrorMessage(error, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
      });
    }
  },

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(identifier, password);
      const payload = unwrapData<{ token?: string; user?: unknown }>(response.data);
      const token = payload.token;
      const user = normalizeUser(payload.user);

      if (!token || !user.id) {
        set({ isLoading: false, error: 'Máy chủ trả về dữ liệu đăng nhập không hợp lệ.' });
        return false;
      }

      await storage.setItem(TOKEN_KEY, token);
      set({ isAuthenticated: true, token, user, isLoading: false, error: null });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Không thể đăng nhập. Vui lòng thử lại.'),
        isAuthenticated: false,
      });
      return false;
    }
  },

  logout: async () => {
    await storage.deleteItem(TOKEN_KEY);
    useCartStore.getState().clearCart();
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    });
  },

  updateUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));
