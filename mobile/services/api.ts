import axios, { AxiosHeaders } from 'axios';
import { storage } from './storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHostIp = (): string | null => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost ||
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return null;
};

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const host = getHostIp();
  if (host && Platform.OS !== 'web') {
    return `http://${host}:3000/api/v1`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }
  return 'http://localhost:3000/api/v1';
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const API_ORIGIN = BASE_URL.replace(/\/api(\/v1)?\/?$/, '');
export const TOKEN_KEY = 'auth_token';

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem(TOKEN_KEY);
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export interface Product {
  id: string;
  productCode: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
  sellingPrice: number;
  price: number;
  importPrice: number;
  stockQuantity: number;
  unit: string;
  imageUrl: string | null;
  status: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export const normalizeCategory = (value: unknown): Category => {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description == null ? null : String(raw.description),
  };
};

export interface CustomerOrder {
  id: string;
  orderCode: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  note: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    unit: string;
  }>;
}

export const unwrapData = <T>(response: unknown): T => {
  if (!response || typeof response !== 'object') return response as T;
  const envelope = response as { data?: unknown };
  return (envelope.data ?? response) as T;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeProduct = (value: unknown): Product => {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const sellingPrice = toNumber(raw.selling_price ?? raw.sellingPrice ?? raw.price);
  return {
    id: String(raw.id ?? raw.product_id ?? ''),
    productCode: String(raw.product_code ?? raw.productCode ?? raw.sku ?? ''),
    barcode: String(raw.barcode ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    categoryId: raw.category_id == null ? null : String(raw.category_id),
    categoryName: String(raw.category_name ?? raw.categoryName ?? ''),
    sellingPrice,
    price: sellingPrice,
    importPrice: toNumber(raw.import_price ?? raw.importPrice),
    stockQuantity: toNumber(raw.stock_quantity ?? raw.stockQuantity ?? raw.stock),
    unit: String(raw.unit ?? 'cái'),
    imageUrl: (raw.main_image ?? raw.image_url ?? raw.imageUrl ?? null) as string | null,
    status: String(raw.status ?? 'ACTIVE'),
  };
};

export const normalizeOrder = (value: unknown): CustomerOrder => {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  return {
    id: String(raw.id ?? ''),
    orderCode: String(raw.order_code ?? raw.orderCode ?? ''),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    status: String(raw.status ?? ''),
    totalAmount: toNumber(raw.total_amount ?? raw.totalAmount),
    paymentMethod: String(raw.payment_method ?? raw.paymentMethod ?? ''),
    note: String(raw.note ?? ''),
    items: rawItems.map((value) => {
      const item = value as Record<string, unknown>;
      return {
        id: String(item.id ?? item.product_id ?? ''),
        productName: String(item.product_name ?? item.name ?? ''),
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unit_price ?? item.price),
        subtotal: toNumber(item.subtotal),
        unit: String(item.unit ?? 'cái'),
      };
    }),
  };
};

export const authAPI = {
  login: (identifier: string, password: string) =>
    api.post('/auth/login', { username: identifier, password }),
  register: (data: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    confirm_password?: string;
  }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { full_name: string; phone: string; email: string }) =>
    api.put('/auth/me', data),
  logout: () => api.post('/auth/logout'),
};

export const productsAPI = {
  getAll: (params: { page?: number; limit?: number; category_id?: string } = {}) =>
    api.get('/products', { params }),
  search: (q: string) => api.get('/products/search', { params: { q } }),
  getById: (id: string) => api.get(`/products/${encodeURIComponent(id)}`),
  getByBarcode: (barcode: string) =>
    api.get(`/products/barcode/${encodeURIComponent(barcode)}`),
  create: (data: {
    sku: string;
    product_code: string;
    barcode: string;
    name: string;
    import_price: number;
    selling_price: number;
    min_stock_level: number;
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
  }>) => api.put(`/products/${encodeURIComponent(id)}`, data),
  delete: (id: string | number) => api.delete(`/products/${encodeURIComponent(id)}`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data: { name: string; description?: string }) => api.post('/categories', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/categories/${id}`, data),
};

export const ordersAPI = {
  getAll: (params?: { status?: string; page?: number }) =>
    api.get('/orders', { params }),
  getMine: (params: { page?: number; limit?: number } = {}) =>
    api.get('/orders/my', { params }),
  getById: (id: string) => api.get(`/orders/${encodeURIComponent(id)}`),
  create: (data: {
    items: { product_id: string; quantity: number }[];
    payment_method: 'TIEN_MAT';
    cash_received: number;
    note: string;
  }) => api.post('/orders', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${encodeURIComponent(id)}/status`, { status }),
};

export const posAPI = {
  create: (data: {
    items: { productId: string; quantity: number; price: number }[];
    totalAmount: number;
    cashReceived: number;
    paymentMethod?: string;
    note?: string;
  }) => api.post('/pos/orders', {
    items: data.items.map((item) => ({
      product_id: parseInt(String(item.productId), 10),
      quantity: item.quantity,
      unit_price: item.price,
    })),
    cash_received: data.cashReceived,
    payment_method: data.paymentMethod || 'TIEN_MAT',
    note: data.note || '',
  }),
  scanBarcode: (barcode: string) => api.post('/pos/scan', { barcode }),
};

export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getOutOfStock: () => api.get('/inventory/out-of-stock'),
  updateStock: (productId: string, stock: number) =>
    api.put(`/inventory/${encodeURIComponent(productId)}`, { stock }),
};

export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id: string | number) => api.get(`/suppliers/${encodeURIComponent(String(id))}`),
};

export const importsAPI = {
  getAll: () => api.get('/purchase-orders'),
  getById: (id: string | number) => api.get(`/purchase-orders/${encodeURIComponent(String(id))}`),
  create: (data: unknown) => api.post('/purchase-orders', data),
};

export const statisticsAPI = {
  getDashboard: () => api.get('/statistics/dashboard'),
};

export default api;
