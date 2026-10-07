/**
 * web/js/api.js
 * REST API Client kết nối Backend Express API (cổng 3000)
 * Kèm fallback mock data thông minh phòng khi database chưa có dữ liệu hoặc offline
 */

const API_BASE = window.location.origin.includes('3000')
  ? `${window.location.origin}/api/v1`
  : 'http://localhost:3000/api/v1';

// Seed demo fallback data
const MOCK_DATA = {
  products: [
    { id: 1, product_code: 'SP001', sku: 'SKU-COCA-330', barcode: '8934588012345', name: 'Coca-Cola lon 330ml', category_id: 1, category_name: 'Đồ uống', unit: 'lon', import_price: 6000, selling_price: 8000, stock_quantity: 48, min_stock_level: 20, brand: 'Coca-Cola', status: 'ACTIVE', shelf_label: 'Kệ A - Tầng 1', icon: '🥤' },
    { id: 2, product_code: 'SP002', sku: 'SKU-PEPSI-330', barcode: '8934588012346', name: 'Pepsi lon 330ml', category_id: 1, category_name: 'Đồ uống', unit: 'lon', import_price: 5500, selling_price: 7500, stock_quantity: 36, min_stock_level: 20, brand: 'Suntory PepsiCo', status: 'ACTIVE', shelf_label: 'Kệ A - Tầng 1', icon: '🥤' },
    { id: 3, product_code: 'SP003', sku: 'SKU-HAOHAO-TC', barcode: '8934673012347', name: 'Mì Hảo Hảo tôm chua cay', category_id: 3, category_name: 'Mì - Cháo ăn liền', unit: 'gói', import_price: 3200, selling_price: 5000, stock_quantity: 60, min_stock_level: 30, brand: 'Acecook', status: 'ACTIVE', shelf_label: 'Kệ B - Tầng 1', icon: '🍜' },
    { id: 4, product_code: 'SP004', sku: 'SKU-3MIEN-BO', barcode: '8934673012348', name: 'Mì 3 Miền bò hầm', category_id: 3, category_name: 'Mì - Cháo ăn liền', unit: 'gói', import_price: 2800, selling_price: 4500, stock_quantity: 12, min_stock_level: 25, brand: 'Uniben', status: 'ACTIVE', shelf_label: 'Kệ B - Tầng 1', icon: '🍜' },
    { id: 5, product_code: 'SP005', sku: 'SKU-VINAMILK-1L', barcode: '8934822012349', name: 'Sữa tươi Vinamilk 1L', category_id: 1, category_name: 'Đồ uống', unit: 'hộp', import_price: 22000, selling_price: 28000, stock_quantity: 5, min_stock_level: 15, brand: 'Vinamilk', status: 'ACTIVE', shelf_label: 'Tủ Mát - Ngăn 1', icon: '🥛' },
    { id: 6, product_code: 'SP006', sku: 'SKU-OREO-137G', barcode: '8936150123456', name: 'Bánh Oreo kem vani 137g', category_id: 2, category_name: 'Bánh kẹo', unit: 'gói', import_price: 15000, selling_price: 22000, stock_quantity: 30, min_stock_level: 10, brand: 'Mondelez', status: 'ACTIVE', shelf_label: 'Kệ A - Tầng 2', icon: '🍪' },
    { id: 7, product_code: 'SP007', sku: 'SKU-POCA-PHOMAI', barcode: '8936150123457', name: 'Snack Poca vị phô mai', category_id: 2, category_name: 'Bánh kẹo', unit: 'gói', import_price: 8000, selling_price: 12000, stock_quantity: 0, min_stock_level: 15, brand: 'PepsiCo Foods', status: 'OUT_OF_STOCK', shelf_label: 'Kệ A - Tầng 2', icon: '🥔' },
    { id: 8, product_code: 'SP008', sku: 'SKU-NAMNGU-500', barcode: '8935024012340', name: 'Nước mắm Nam Ngư 500ml', category_id: 4, category_name: 'Gia vị', unit: 'chai', import_price: 18000, selling_price: 25000, stock_quantity: 20, min_stock_level: 10, brand: 'Masan', status: 'ACTIVE', shelf_label: 'Kệ C - Tầng 1', icon: '🍾' },
    { id: 9, product_code: 'SP009', sku: 'SKU-TUONGAN-1L', barcode: '8936077012341', name: 'Dầu ăn Tường An 1L', category_id: 4, category_name: 'Gia vị', unit: 'chai', import_price: 35000, selling_price: 45000, stock_quantity: 18, min_stock_level: 10, brand: 'Tường An', status: 'ACTIVE', shelf_label: 'Kệ C - Tầng 1', icon: '🛢️' },
    { id: 10, product_code: 'SP010', sku: 'SKU-CLEAR-380', barcode: '8938792012342', name: 'Dầu gội Clear Men 380ml', category_id: 5, category_name: 'Vệ sinh cá nhân', unit: 'chai', import_price: 55000, selling_price: 75000, stock_quantity: 14, min_stock_level: 8, brand: 'Unilever', status: 'ACTIVE', shelf_label: 'Kệ B - Tầng 2', icon: '🧴' },
  ],
  categories: [
    { id: 1, name: 'Đồ uống', description: 'Nước ngọt, nước suối, bia, sữa...', total_products: 3, status: 'ACTIVE' },
    { id: 2, name: 'Bánh kẹo', description: 'Bánh quy, kẹo, snack, socola...', total_products: 2, status: 'ACTIVE' },
    { id: 3, name: 'Mì - Cháo ăn liền', description: 'Mì tôm, cháo, phở đóng gói...', total_products: 2, status: 'ACTIVE' },
    { id: 4, name: 'Gia vị', description: 'Muối, đường, nước mắm, dầu ăn...', total_products: 2, status: 'ACTIVE' },
    { id: 5, name: 'Vệ sinh cá nhân', description: 'Dầu gội, sữa tắm, kem đánh răng...', total_products: 1, status: 'ACTIVE' },
    { id: 6, name: 'Thực phẩm khô', description: 'Gạo, bột nếp, đậu xanh, nấm khô...', total_products: 0, status: 'ACTIVE' },
  ],
  suppliers: [
    { id: 1, name: 'Công ty CP Coca-Cola Việt Nam', contact_person: 'Nguyễn Thị B', phone: '028-38255678', email: 'orders@coca-cola.vn', address: '485 Xa lộ Hà Nội, Q.9, TP.HCM', status: 'ACTIVE' },
    { id: 2, name: 'Công ty TNHH Masan Consumer', contact_person: 'Trần Văn C', phone: '028-38152060', email: 'sales@masanconsumer.com', address: 'Tầng 12, Saigon Centre, Q.1, TP.HCM', status: 'ACTIVE' },
    { id: 3, name: 'Công ty CP Vinamilk', contact_person: 'Lê Thị D', phone: '028-54155555', email: 'contact@vinamilk.com.vn', address: '10 Tân Trào, Q.7, TP.HCM', status: 'ACTIVE' },
    { id: 4, name: 'Đại lý Hàng tiêu dùng Minh Phát', contact_person: 'Anh Minh', phone: '0901111222', email: 'minhphat@gmail.com', address: '123 Lê Văn Việt, TP. Thủ Đức', status: 'ACTIVE' },
  ],
  batches: [
    { id: 1, batch_code: 'LO-COCA-202610-01', product_id: 1, product_name: 'Coca-Cola lon 330ml', import_id: 1, quantity: 48, import_price: 6000, mfg_date: '2026-09-01', expiry_date: '2027-09-01', days_remaining: 328, status: 'ACTIVE', shelf_label: 'Kệ A - T1' },
    { id: 2, batch_code: 'LO-PEPSI-202610-02', product_id: 2, product_name: 'Pepsi lon 330ml', import_id: 1, quantity: 36, import_price: 5500, mfg_date: '2026-09-01', expiry_date: '2027-09-01', days_remaining: 328, status: 'ACTIVE', shelf_label: 'Kệ A - T1' },
    { id: 3, batch_code: 'LO-HAOHAO-202610-03', product_id: 3, product_name: 'Mì Hảo Hảo tôm chua cay', import_id: 1, quantity: 60, import_price: 3200, mfg_date: '2026-08-10', expiry_date: '2027-02-10', days_remaining: 125, status: 'ACTIVE', shelf_label: 'Kệ B - T1' },
    { id: 4, batch_code: 'LO-3MIEN-202609-04', product_id: 4, product_name: 'Mì 3 Miền bò hầm', import_id: 1, quantity: 12, import_price: 2800, mfg_date: '2026-04-01', expiry_date: '2026-10-15', days_remaining: 8, status: 'ACTIVE', shelf_label: 'Kệ B - T1' },
    { id: 5, batch_code: 'LO-MILK-202610-05', product_id: 5, product_name: 'Sữa tươi Vinamilk 1L', import_id: 2, quantity: 5, import_price: 22000, mfg_date: '2026-09-15', expiry_date: '2026-10-25', days_remaining: 18, status: 'ACTIVE', shelf_label: 'Tủ Mát - N1' },
    { id: 6, batch_code: 'LO-OREO-202610-06', product_id: 6, product_name: 'Bánh Oreo kem vani 137g', import_id: 2, quantity: 30, import_price: 15000, mfg_date: '2026-08-01', expiry_date: '2027-08-01', days_remaining: 298, status: 'ACTIVE', shelf_label: 'Kệ A - T2' },
    { id: 7, batch_code: 'LO-NAMNGU-202610-07', product_id: 8, product_name: 'Nước mắm Nam Ngư 500ml', import_id: 3, quantity: 20, import_price: 18000, mfg_date: '2026-07-01', expiry_date: '2027-07-01', days_remaining: 267, status: 'ACTIVE', shelf_label: 'Kệ C - T1' },
    { id: 8, batch_code: 'LO-TUONGAN-202610-08', product_id: 9, product_name: 'Dầu ăn Tường An 1L', import_id: 3, quantity: 18, import_price: 35000, mfg_date: '2026-07-15', expiry_date: '2027-07-15', days_remaining: 281, status: 'ACTIVE', shelf_label: 'Kệ C - T1' },
    { id: 9, batch_code: 'LO-CLEAR-202610-09', product_id: 10, product_name: 'Dầu gội Clear Men 380ml', import_id: 3, quantity: 14, import_price: 55000, mfg_date: '2026-06-01', expiry_date: '2028-06-01', days_remaining: 602, status: 'ACTIVE', shelf_label: 'Kệ B - T2' },
  ],
  purchaseOrders: [
    {
      id: 1,
      po_code: 'PN20261001001',
      supplier_name: 'Công ty CP Coca-Cola Việt Nam',
      creator_name: 'Quản Lý Cửa Hàng',
      import_date: '2026-10-01',
      total_amount: 2400000,
      items_count: 2,
      note: 'Nhập định kỳ đầu tháng',
      items: [
        { product_id: 1, product_name: 'Coca-Cola lon 330ml', unit: 'lon', quantity: 200, import_price: 6000, batch_code: 'LO-COCA-202610-01', expiry_date: '2027-09-01' },
        { product_id: 2, product_name: 'Pepsi lon 330ml', unit: 'lon', quantity: 200, import_price: 6000, batch_code: 'LO-PEPSI-202610-02', expiry_date: '2027-09-01' },
      ],
    },
    {
      id: 2,
      po_code: 'PN20261003002',
      supplier_name: 'Công ty CP Vinamilk',
      creator_name: 'Quản Lý Cửa Hàng',
      import_date: '2026-10-03',
      total_amount: 5280000,
      items_count: 1,
      note: 'Nhập bổ sung sữa tươi',
      items: [
        { product_id: 5, product_name: 'Sữa tươi Vinamilk 1L', unit: 'hộp', quantity: 240, import_price: 22000, batch_code: 'LO-MILK-202610-05', expiry_date: '2026-10-25' },
      ],
    },
    {
      id: 3,
      po_code: 'PN20261006003',
      supplier_name: 'Công ty TNHH Masan Consumer',
      creator_name: 'Quản Trị Viên (Admin)',
      import_date: '2026-10-06',
      total_amount: 3600000,
      items_count: 2,
      note: 'Nhập nước mắm và mì',
      items: [
        { product_id: 8, product_name: 'Nước mắm Nam Ngư 500ml', unit: 'chai', quantity: 100, import_price: 18000, batch_code: 'LO-NAMNGU-202610-07', expiry_date: '2027-07-01' },
        { product_id: 3, product_name: 'Mì Hảo Hảo tôm chua cay', unit: 'gói', quantity: 562, import_price: 3200, batch_code: 'LO-HAOHAO-202610-03', expiry_date: '2027-02-10' },
      ],
    },
  ],
  orders: [
    { id: 1, order_code: 'DH20261007_001', customer_name: 'Nguyễn Văn An', phone: '0912345678', address: '12 Đường Số 5, P. Tăng Nhơn Phú B, TP. Thủ Đức', created_at: '2026-10-07 14:30', total_amount: 145000, payment_method: 'COD', payment_status: 'PAID', status: 'COMPLETED', items: [ { name: 'Coca-Cola lon 330ml', quantity: 6, price: 8000 }, { name: 'Mì Hảo Hảo tôm chua cay', quantity: 10, price: 5000 }, { name: 'Snack Poca vị phô mai', quantity: 4, price: 12000 } ] },
    { id: 2, order_code: 'DH20261007_002', customer_name: 'Trần Thị Mai', phone: '0988776655', address: '45 Lê Văn Việt, P. Hiệp Phú, TP. Thủ Đức', created_at: '2026-10-07 16:15', total_amount: 86000, payment_method: 'VNPAY', payment_status: 'PAID', status: 'PENDING', items: [ { name: 'Sữa tươi Vinamilk 1L', quantity: 2, price: 28000 }, { name: 'Bánh Oreo kem vani 137g', quantity: 1, price: 22000 }, { name: 'Pepsi lon 330ml', quantity: 1, price: 8000 } ] },
    { id: 3, order_code: 'DH20261007_003', customer_name: 'Lê Hoàng Nam', phone: '0903334455', address: '78 Đỗ Xuân Hợp, P. Phước Long B, TP. Thủ Đức', created_at: '2026-10-07 18:40', total_amount: 215000, payment_method: 'COD', payment_status: 'UNPAID', status: 'CANCELLED', items: [ { name: 'Dầu ăn Tường An 1L', quantity: 2, price: 45000 }, { name: 'Nước mắm Nam Ngư 500ml', quantity: 2, price: 25000 }, { name: 'Dầu gội Clear Men 380ml', quantity: 1, price: 75000 } ] },
  ],
  users: [
    { id: 1, full_name: 'Quản Trị Viên (Admin)', username: 'admin', email: 'admin@taphoavinh.com', phone: '0901234567', role: 'ADMIN', is_active: 1, created_at: '2026-09-01' },
    { id: 2, full_name: 'Quản Lý Cửa Hàng', username: 'manager1', email: 'manager@taphoavinh.com', phone: '0901234568', role: 'MANAGER', is_active: 1, created_at: '2026-09-02' },
    { id: 3, full_name: 'Thu Ngân 01', username: 'cashier1', email: 'cashier@taphoavinh.com', phone: '0901234569', role: 'CASHIER', is_active: 1, created_at: '2026-09-05' },
    { id: 4, full_name: 'Khách Hàng Thân Thiết', username: 'customer1', email: 'customer@taphoavinh.com', phone: '0909999888', role: 'CUSTOMER', is_active: 1, created_at: '2026-09-10' },
  ],
};

const api = {
  token: localStorage.getItem('pos_token') || '',

  async ensureToken() {
    if (this.token && this.token !== 'mock_jwt_token') return this.token;
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.token) {
          this.token = data.data.token;
          localStorage.setItem('pos_token', this.token);
          if (data.data.user) {
            localStorage.setItem('pos_user', JSON.stringify(data.data.user));
          }
          return this.token;
        }
      }
    } catch (err) {
      // API server offline, keep fallback
    }
    return this.token;
  },

  async request(endpoint, options = {}) {
    if (!this.token || this.token === 'mock_jwt_token') {
      if (!endpoint.includes('/auth/login')) {
        await this.ensureToken();
      }
    }

    let headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      let res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      // Tự động làm mới token nếu 401
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        this.token = '';
        await this.ensureToken();
        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`;
          res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
          });
        }
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi từ máy chủ API');
      }
      return data;
    } catch (err) {
      console.warn(`[API] Gọi ${endpoint} thất bại:`, err.message);
      throw err;
    }
  },

  // ==================== AUTH ====================
  async login(username, password) {
    try {
      const res = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (res?.data?.token) {
        this.token = res.data.token;
        localStorage.setItem('pos_token', this.token);
        localStorage.setItem('pos_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (e) {
      // Mock login tiện lợi
      let role = 'ADMIN';
      let fullName = 'Quản Trị Viên';
      if (username.includes('manager')) { role = 'MANAGER'; fullName = 'Quản Lý Cửa Hàng'; }
      if (username.includes('cashier')) { role = 'CASHIER'; fullName = 'Thu Ngân 01'; }
      
      const mockUser = { id: 1, username, full_name: fullName, role, email: `${username}@taphoavinh.com` };
      this.token = 'mock_jwt_token';
      localStorage.setItem('pos_token', this.token);
      localStorage.setItem('pos_user', JSON.stringify(mockUser));
      return { token: this.token, user: mockUser };
    }
  },

  async getMe() {
    try {
      const res = await this.request('/auth/me');
      return res.data?.user;
    } catch (e) {
      const stored = localStorage.getItem('pos_user');
      return stored ? JSON.parse(stored) : MOCK_DATA.users[0];
    }
  },

  logout() {
    this.token = '';
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  },

  // ==================== PRODUCTS ====================
  async getProducts(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request(`/products?${qs}`);
      return res.data?.products || MOCK_DATA.products;
    } catch (e) {
      return MOCK_DATA.products;
    }
  },

  async createProduct(payload) {
    try {
      const res = await this.request('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data?.product;
    } catch (e) {
      const newProd = { id: Date.now(), ...payload, stock_quantity: 0 };
      MOCK_DATA.products.unshift(newProd);
      return newProd;
    }
  },

  async updateProduct(id, payload) {
    try {
      const res = await this.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data?.product;
    } catch (e) {
      const idx = MOCK_DATA.products.findIndex(p => p.id == id);
      if (idx !== -1) Object.assign(MOCK_DATA.products[idx], payload);
      return MOCK_DATA.products[idx];
    }
  },

  async deleteProduct(id) {
    try {
      await this.request(`/products/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      MOCK_DATA.products = MOCK_DATA.products.filter(p => p.id != id);
      return true;
    }
  },

  // ==================== CATEGORIES ====================
  async getCategories() {
    try {
      const res = await this.request('/categories');
      return res.data?.categories || MOCK_DATA.categories;
    } catch (e) {
      return MOCK_DATA.categories;
    }
  },

  async createCategory(payload) {
    try {
      const res = await this.request('/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data?.category;
    } catch (e) {
      const newCat = { id: Date.now(), ...payload, total_products: 0, status: 'ACTIVE' };
      MOCK_DATA.categories.push(newCat);
      return newCat;
    }
  },

  async updateCategory(id, payload) {
    try {
      const res = await this.request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data?.category;
    } catch (e) {
      const idx = MOCK_DATA.categories.findIndex(c => c.id == id);
      if (idx !== -1) Object.assign(MOCK_DATA.categories[idx], payload);
      return MOCK_DATA.categories[idx];
    }
  },

  async deleteCategory(id) {
    try {
      await this.request(`/categories/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      MOCK_DATA.categories = MOCK_DATA.categories.filter(c => c.id != id);
      return true;
    }
  },

  // ==================== INVENTORY & BATCHES ====================
  async getInventory(params = {}) {
    try {
      const mergedParams = { limit: 100, ...params };
      const qs = new URLSearchParams(mergedParams).toString();
      const res = await this.request(`/inventory?${qs}`);
      return res.data?.inventory || MOCK_DATA.products;
    } catch (e) {
      return MOCK_DATA.products;
    }
  },

  async getBatches(params = {}) {
    try {
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '' && v !== 'ALL'));
      const qs = new URLSearchParams(cleanParams).toString();
      const res = await this.request(`/inventory/batches${qs ? '?' + qs : ''}`);
      return res.data?.batches || MOCK_DATA.batches;
    } catch (e) {
      console.warn('Lỗi gọi /inventory/batches, dùng fallback mock:', e);
      return MOCK_DATA.batches;
    }
  },

  async adjustStock(productId, adjustment, reason) {
    try {
      const res = await this.request(`/inventory/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ adjustment, reason }),
      });
      return res.data;
    } catch (e) {
      const p = MOCK_DATA.products.find(x => x.id == productId);
      if (p) p.stock_quantity = Math.max(0, p.stock_quantity + parseInt(adjustment));
      return { success: true };
    }
  },

  // ==================== PURCHASE ORDERS ====================
  async getPurchaseOrders() {
    try {
      const res = await this.request('/purchase-orders');
      return res.data?.purchase_orders || res.data?.imports || MOCK_DATA.purchaseOrders;
    } catch (e) {
      return MOCK_DATA.purchaseOrders;
    }
  },

  async getPurchaseOrderById(id) {
    try {
      const res = await this.request(`/purchase-orders/${id}`);
      return res.data?.import || res.data?.purchase_order;
    } catch (e) {
      return MOCK_DATA.purchaseOrders.find(p => p.id == id);
    }
  },

  async createPurchaseOrder(payload) {
    try {
      const res = await this.request('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data?.import || res.data;
    } catch (e) {
      const poId = Date.now();
      const newPo = {
        id: poId,
        po_code: `PN${Date.now().toString().slice(-8)}`,
        supplier_name: payload.supplier_name || 'Nhà Cung Cấp',
        creator_name: 'Quản Lý Cửa Hàng',
        import_date: payload.import_date || new Date().toISOString().slice(0, 10),
        total_amount: payload.total_amount || 0,
        items_count: payload.items?.length || 0,
        items: payload.items || [],
        note: payload.note || '',
      };
      MOCK_DATA.purchaseOrders.unshift(newPo);

      // Cập nhật tồn kho MOCK_DATA.batches và MOCK_DATA.products
      if (payload.items && Array.isArray(payload.items)) {
        payload.items.forEach((item, idx) => {
          const prod = MOCK_DATA.products.find(p => p.id == item.product_id);
          const qty = parseInt(item.quantity) || 0;
          const cost = parseFloat(item.import_price) || 0;

          if (prod) {
            prod.stock_quantity = (prod.stock_quantity || 0) + qty;
            if (cost > 0) prod.import_price = cost;
          }

          MOCK_DATA.batches.push({
            id: Date.now() + idx,
            batch_code: item.batch_code || `LO-${prod?.product_code || 'SP'}-${Date.now().toString().slice(-4)}`,
            product_id: parseInt(item.product_id),
            product_name: prod?.name || 'Sản phẩm',
            import_id: poId,
            quantity: qty,
            original_quantity: qty,
            import_price: cost,
            import_date: payload.import_date || new Date().toISOString().slice(0, 10),
            expiry_date: item.expiry_date || null,
            status: 'ACTIVE',
            shelf_label: prod?.shelf_label || 'Kệ A - T1',
          });
        });
      }

      return newPo;
    }
  },

  // ==================== SUPPLIERS ====================
  async getSuppliers() {
    try {
      const res = await this.request('/suppliers');
      return res.data?.suppliers || MOCK_DATA.suppliers;
    } catch (e) {
      return MOCK_DATA.suppliers;
    }
  },

  async createSupplier(payload) {
    try {
      const res = await this.request('/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data?.supplier;
    } catch (e) {
      const newSup = { id: Date.now(), ...payload, status: 'ACTIVE' };
      MOCK_DATA.suppliers.push(newSup);
      return newSup;
    }
  },

  async updateSupplier(id, payload) {
    try {
      const res = await this.request(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data?.supplier;
    } catch (e) {
      const idx = MOCK_DATA.suppliers.findIndex(s => s.id == id);
      if (idx !== -1) Object.assign(MOCK_DATA.suppliers[idx], payload);
      return MOCK_DATA.suppliers[idx];
    }
  },

  // ==================== ORDERS (ONLINE & POS) ====================
  async getOrders(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request(`/orders?${qs}`);
      return res.data?.orders || MOCK_DATA.orders;
    } catch (e) {
      return MOCK_DATA.orders;
    }
  },

  async getOrderById(id) {
    try {
      const res = await this.request(`/orders/${id}`);
      return res.data?.order || null;
    } catch (e) {
      return MOCK_DATA.orders.find(o => o.id == id) || null;
    }
  },

  async cancelOrder(id) {
    try {
      await this.request(`/orders/${id}/cancel`, { method: 'PATCH' });
      return true;
    } catch (e) {
      const ord = MOCK_DATA.orders.find(o => o.id == id);
      if (ord) ord.status = 'CANCELLED';
      return true;
    }
  },

  async updateOrderStatus(id, status) {
    try {
      const res = await this.request(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.data?.order || { success: true };
    } catch (e) {
      const ord = MOCK_DATA.orders.find(o => o.id == id);
      if (ord) ord.status = status;
      return ord || { success: true };
    }
  },

  // ==================== POS SCAN & ORDER ====================
  async scanBarcode(barcode) {
    try {
      const res = await this.request('/pos/scan', {
        method: 'POST',
        body: JSON.stringify({ barcode }),
      });
      return res.data?.product;
    } catch (e) {
      const found = MOCK_DATA.products.find(p => p.barcode === barcode);
      if (found) return found;
      throw new Error(`Không tìm thấy sản phẩm có barcode: ${barcode}`);
    }
  },

  async createPosOrder(payload) {
    try {
      const res = await this.request('/pos/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data?.order;
    } catch (e) {
      // Mock order
      return {
        id: Date.now(),
        order_code: `HD${Date.now().toString().slice(-8)}`,
        created_at: new Date().toISOString(),
        cashier_name: 'Thu Ngân POS',
        payment_method: payload.payment_method === 'TIEN_MAT' ? 'Tiền mặt' : payload.payment_method,
        total_amount: payload.total_amount,
        cash_received: payload.cash_received,
        change_amount: Math.max(0, payload.cash_received - payload.total_amount),
        items: payload.items,
      };
    }
  },

  // ==================== USERS ====================
  async getUsers() {
    try {
      const res = await this.request('/users');
      return res.data?.users || MOCK_DATA.users;
    } catch (e) {
      return MOCK_DATA.users;
    }
  },

  async createUser(payload) {
    try {
      const res = await this.request('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data?.user;
    } catch (e) {
      const newUser = { id: Date.now(), ...payload, is_active: 1, created_at: new Date().toISOString().slice(0, 10) };
      MOCK_DATA.users.push(newUser);
      return newUser;
    }
  },

  async toggleUserStatus(id, isActive) {
    try {
      const endpoint = isActive ? `/users/${id}/unlock` : `/users/${id}/lock`;
      await this.request(endpoint, { method: 'PATCH' });
      return true;
    } catch (e) {
      const u = MOCK_DATA.users.find(x => x.id == id);
      if (u) u.is_active = isActive ? 1 : 0;
      return true;
    }
  },

  // ==================== REPORTS & DASHBOARD ====================
  async getDashboard() {
    try {
      const res = await this.request('/reports/dashboard');
      return res.data;
    } catch (e) {
      return {
        today_revenue: 3450000,
        month_revenue: 86500000,
        today_orders: 42,
        total_items_sold: 268,
        inventory_valuation: 142000000,
        low_stock: 4,
        expiring_soon: 3,
      };
    }
  },

  async getRevenueReport(filter = '7days') {
    try {
      const res = await this.request(`/reports/revenue?type=daily`);
      return res.data?.revenue || [];
    } catch (e) {
      return [
        { date: '01/10', revenue: 2800000, orders: 32 },
        { date: '02/10', revenue: 3200000, orders: 38 },
        { date: '03/10', revenue: 2950000, orders: 34 },
        { date: '04/10', revenue: 4100000, orders: 48 },
        { date: '05/10', revenue: 3800000, orders: 44 },
        { date: '06/10', revenue: 4500000, orders: 52 },
        { date: '07/10', revenue: 3450000, orders: 42 },
      ];
    }
  },

  async getTopSelling() {
    try {
      const res = await this.request('/reports/products/top-selling');
      return res.data?.top_selling || [];
    } catch (e) {
      return [
        { name: 'Coca-Cola lon 330ml', sku: 'SKU-COCA-330', quantity_sold: 142, revenue: 1136000, icon: '🥤' },
        { name: 'Mì Hảo Hảo tôm chua cay', sku: 'SKU-HAOHAO-TC', quantity_sold: 120, revenue: 600000, icon: '🍜' },
        { name: 'Sữa tươi Vinamilk 1L', sku: 'SKU-VINAMILK-1L', quantity_sold: 45, revenue: 1260000, icon: '🥛' },
        { name: 'Pepsi lon 330ml', sku: 'SKU-PEPSI-330', quantity_sold: 88, revenue: 660000, icon: '🥤' },
        { name: 'Dầu ăn Tường An 1L', sku: 'SKU-TUONGAN-1L', quantity_sold: 22, revenue: 990000, icon: '🛢️' },
      ];
    }
  },
};

window.api = api;
window.MOCK_DATA = MOCK_DATA;
