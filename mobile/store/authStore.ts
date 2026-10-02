import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI, TOKEN_KEY } from '../services/api';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // Kiểm tra token lưu sẵn khi khởi động app
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        set({ isAuthenticated: true, token, isLoading: false, error: null });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  // Gọi API đăng nhập
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(username, password);
      const { token, user } = response.data;

      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        set({
          isAuthenticated: true,
          token,
          user,
          isLoading: false,
          error: null,
        });
        return true;
      }
      set({ isLoading: false, error: 'Đăng nhập thất bại' });
      return false;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu sai';
      set({ isLoading: false, error: msg, isAuthenticated: false });
      return false;
    }
  },

  // Đăng xuất và xoá token
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
