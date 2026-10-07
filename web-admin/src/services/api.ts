import axios from 'axios';
import { getToken, clearAuth } from '@/utils/auth';
import type {
  LoginPayload,
  AuthResponse,
  Product,
  ProductPayload,
  Category,
  CategoryPayload,
  InventoryItem,
  Supplier,
  SupplierPayload,
  Order,
  OrderPayload,
  ImportOrder,
  ImportPayload,
  DashboardStats,
  User,
} from '@/types';

const BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== Auth ====================
export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),

  getUsers: () =>
    api.get<{ data: User[] }>('/auth/users'),

  createUser: (payload: Partial<User> & { password: string }) =>
    api.post<{ data: User }>('/auth/users', payload),

  lockUser: (id: number) =>
    api.patch(`/auth/users/${id}/lock`),

  unlockUser: (id: number) =>
    api.patch(`/auth/users/${id}/unlock`),
};

// ==================== Products ====================
export const productsApi = {
  getAll: () =>
    api.get<{ data: Product[] }>('/products'),

  getById: (id: number) =>
    api.get<{ data: Product }>(`/products/${id}`),

  search: (q: string) =>
    api.get<{ data: Product[] }>(`/products/search?q=${encodeURIComponent(q)}`),

  getByBarcode: (barcode: string) =>
    api.get<{ data: Product }>(`/products/barcode/${barcode}`),

  create: (payload: ProductPayload) =>
    api.post<{ data: Product }>('/products', payload),

  update: (id: number, payload: Partial<ProductPayload>) =>
    api.put<{ data: Product }>(`/products/${id}`, payload),

  delete: (id: number) =>
    api.delete(`/products/${id}`),
};

// ==================== Categories ====================
export const categoriesApi = {
  getAll: () =>
    api.get<{ data: Category[] }>('/categories'),

  create: (payload: CategoryPayload) =>
    api.post<{ data: Category }>('/categories', payload),

  update: (id: number, payload: Partial<CategoryPayload>) =>
    api.put<{ data: Category }>(`/categories/${id}`, payload),

  delete: (id: number) =>
    api.delete(`/categories/${id}`),
};

// ==================== Inventory ====================
export const inventoryApi = {
  getAll: () =>
    api.get<{ data: InventoryItem[] }>('/inventory'),

  getLowStock: () =>
    api.get<{ data: InventoryItem[] }>('/inventory/low-stock'),

  getOutOfStock: () =>
    api.get<{ data: InventoryItem[] }>('/inventory/out-of-stock'),

  updateStock: (productId: number, quantity: number) =>
    api.put(`/inventory/${productId}`, { quantity }),
};

// ==================== Suppliers ====================
export const suppliersApi = {
  getAll: () =>
    api.get<{ data: Supplier[] }>('/suppliers'),

  create: (payload: SupplierPayload) =>
    api.post<{ data: Supplier }>('/suppliers', payload),

  update: (id: number, payload: Partial<SupplierPayload>) =>
    api.put<{ data: Supplier }>(`/suppliers/${id}`, payload),
};

// ==================== Orders ====================
export const ordersApi = {
  getAll: () =>
    api.get<{ data: Order[] }>('/orders'),

  create: (payload: OrderPayload) =>
    api.post<{ data: Order }>('/orders', payload),

  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// ==================== Imports ====================
export const importsApi = {
  getAll: () =>
    api.get<{ data: ImportOrder[] }>('/imports'),

  create: (payload: ImportPayload) =>
    api.post<{ data: ImportOrder }>('/imports', payload),
};

// ==================== Statistics ====================
export const statisticsApi = {
  getDashboard: () =>
    api.get<{ data: DashboardStats }>('/statistics/dashboard'),
};

export default api;
