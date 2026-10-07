import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android emulator → 10.0.2.2  |  Thiết bị thật → IP LAN máy tính
const BASE_URL =
  Platform.OS === 'android'
    ? 'http://192.168.1.10:3000/api'
    : 'http://192.168.1.10:3000/api';

export const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Tự động đính Bearer token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== AUTH ====================
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
};

// ==================== PRODUCTS ====================
export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; category_id?: string; status?: string }) =>
    api.get('/products', { params }),
  search: (q: string) => api.get('/products/search', { params: { q } }),
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  getById: (id: string | number) => api.get(`/products/${id}`),
  create: (data: {
    sku: string;
    product_code: string;
    barcode?: string;
    name: string;
    import_price: number;
    selling_price: number;
    min_stock_level?: number;
    category_id?: number;
    unit?: string;
    description?: string;
    shelf_location?: string;
    expiry_date?: string;
  }) => api.post('/products', data),
  update: (id: string | number, data: Partial<{
    sku: string;
    product_code: string;
    barcode: string;
    name: string;
    import_price: number;
    selling_price: number;
    min_stock_level: number;
    category_id: number;
    unit: string;
    description: string;
    shelf_location: string;
    expiry_date: string;
    is_active: boolean;
  }>) => api.put(`/products/${id}`, data),
  delete: (id: string | number) => api.delete(`/products/${id}`),
};

// ==================== CATEGORIES ====================
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data: { name: string; description?: string }) => api.post('/categories', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/categories/${id}`, data),
};

// ==================== INVENTORY ====================
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getOutOfStock: () => api.get('/inventory/out-of-stock'),
  updateStock: (productId: string, stock: number) =>
    api.put(`/inventory/${productId}`, { stock }),
};

// ==================== ORDERS ====================
export const ordersAPI = {
  getAll: (params?: { status?: string; page?: number }) =>
    api.get('/orders', { params }),
  create: (data: {
    items: { productId: string; quantity: number; price: number }[];
    totalAmount: number;
    cashReceived: number;
    payment_method?: string;
  }) => api.post('/orders', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// ==================== IMPORTS ====================
export const importsAPI = {
  getAll: () => api.get('/imports'),
  create: (data: any) => api.post('/imports', data),
};

// ==================== STATISTICS ====================
export const statisticsAPI = {
  getDashboard: () => api.get('/statistics/dashboard'),
};

export default api;
