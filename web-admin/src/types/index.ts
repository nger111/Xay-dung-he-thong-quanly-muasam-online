// ==================== Auth Types ====================
export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_locked?: boolean;
  created_at?: string;
}

export type UserRole = 'ADMIN' | 'CHU_QUAN' | 'MANAGER' | 'CASHIER' | 'NHAN_VIEN';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  data: {
    token: string;
    user: User;
  };
}

// ==================== Category Types ====================
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
}

// ==================== Product Types ====================
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id: number;
  category?: Category;
  price: number;
  cost_price?: number;
  unit: string;
  image_url?: string;
  is_active: boolean;
  stock_quantity?: number;
  min_stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPayload {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id: number;
  price: number;
  cost_price?: number;
  unit: string;
  image_url?: string;
  is_active?: boolean;
  min_stock?: number;
}

// ==================== Inventory Types ====================
export interface InventoryItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  location?: string;
  last_updated?: string;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

// ==================== Supplier Types ====================
export interface Supplier {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  is_active: boolean;
  created_at?: string;
}

export interface SupplierPayload {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  is_active?: boolean;
}

// ==================== Order Types ====================
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface OrderItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_code: string;
  customer_name?: string;
  customer_phone?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  discount?: number;
  note?: string;
  created_by?: number;
  cashier?: User;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface OrderPayload {
  customer_name?: string;
  customer_phone?: string;
  payment_method: PaymentMethod;
  discount?: number;
  note?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
  }[];
}

// ==================== Import Types ====================
export interface ImportItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface ImportOrder {
  id: number;
  import_code: string;
  supplier_id: number;
  supplier: Supplier;
  status: 'pending' | 'received' | 'cancelled';
  total_amount: number;
  note?: string;
  items: ImportItem[];
  created_by?: number;
  creator?: User;
  created_at: string;
}

export interface ImportPayload {
  supplier_id: number;
  note?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_cost: number;
  }[];
}

// ==================== Dashboard/Statistics Types ====================
export interface DashboardStats {
  today_revenue: number;
  today_orders: number;
  total_products: number;
  low_stock: number;
  out_of_stock: number;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ==================== Cart Types (POS) ====================
export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}
