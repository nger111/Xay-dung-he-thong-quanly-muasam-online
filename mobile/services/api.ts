import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android emulator dùng 10.0.2.2 để trỏ về localhost máy tính
// iOS simulator dùng localhost
// Thiết bị thật dùng IP mạng nội bộ của máy tính
const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';

export const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động đính kèm Bearer token vào mọi request
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== AUTH ====================
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
};

// ==================== PRODUCTS ====================
export const productsAPI = {
  getAll: () => api.get('/products'),
  search: (q: string) => api.get('/products/search', { params: { q } }),
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  create: (data: {
    code: string;
    barcode: string;
    name: string;
    importPrice: number;
    exportPrice: number;
    minStock: number;
  }) => api.post('/products', data),
};

// ==================== INVENTORY ====================
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getOutOfStock: () => api.get('/inventory/out-of-stock'),
  updateStock: (productId: string, stock: number) =>
    api.put(`/inventory/${productId}`, { stock }),
};

// ==================== ORDERS (POS) ====================
export const ordersAPI = {
  create: (data: {
    items: { productId: string; quantity: number; price: number }[];
    totalAmount: number;
    cashReceived: number;
  }) => api.post('/orders', data),
};

// ==================== IMPORTS ====================
export const importsAPI = {
  getAll: () => api.get('/imports'),
};

// ==================== STATISTICS ====================
export const statisticsAPI = {
  getDashboard: () => api.get('/statistics/dashboard'),
};

export default api;
