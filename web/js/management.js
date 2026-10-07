/**
 * web/js/management.js
 * Quản lý Danh mục, Nhà cung cấp, Người dùng & Cài đặt hệ thống
 */

class ManagementManager {
  constructor() {
    this.categories = [];
    this.suppliers = [];
    this.users = [];
    this.editingCategoryId = null;
    this.editingSupplierId = null;
  }

  async init() {
    await this.loadCategories();
    await this.loadSuppliers();
    await this.loadUsers();
    this.bindEvents();
    this.loadSettings();
  }

  // ==================== CATEGORIES ====================
  async loadCategories() {
    this.categories = await window.api.getCategories();
    this.renderCategoriesTable();
  }

  renderCategoriesTable() {
    const tbody = document.getElementById('categories-table-body');
    if (!tbody) return;

    if (!this.categories || this.categories.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
            <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
            Chưa có danh mục nào. Bấm <strong>"+ Thêm Danh Mục Mới"</strong> để tạo danh mục.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.categories.map((c, idx) => `
      <tr>
        <td><code>DM${(c.id || idx + 1).toString().padStart(3, '0')}</code></td>
        <td style="font-weight: 600;">${c.name}</td>
        <td style="color: var(--text-secondary);">${c.description || '—'}</td>
        <td style="font-weight: 700;">${c.total_products || 0} sản phẩm</td>
        <td><span class="badge badge-success">Hoạt động</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="window.management.openCategoryModal(${c.id})" title="Chỉnh sửa danh mục">
            ✏️ Sửa
          </button>
        </td>
      </tr>
    `).join('');
  }

  openCategoryModal(catId = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const saveBtn = document.getElementById('btn-save-category');
    if (!modal) return;

    const cat = catId ? this.categories.find(c => c.id == catId) : null;
    this.editingCategoryId = cat ? cat.id : null;

    if (title) {
      title.textContent = cat ? '✏️ Chỉnh Sửa Danh Mục' : '📂 Thêm Danh Mục Mới';
    }
    if (saveBtn) {
      saveBtn.textContent = cat ? 'Cập Nhật Danh Mục' : 'Lưu Danh Mục';
    }

    const idInput = document.getElementById('cat-form-id');
    const nameInput = document.getElementById('cat-form-name');
    const descInput = document.getElementById('cat-form-desc');

    if (idInput) idInput.value = cat ? cat.id : '';
    if (nameInput) nameInput.value = cat ? cat.name : '';
    if (descInput) descInput.value = cat ? (cat.description || '') : '';

    modal.classList.add('active');
    setTimeout(() => nameInput?.focus(), 100);
  }

  closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.classList.remove('active');
    this.editingCategoryId = null;
    document.getElementById('category-form')?.reset();
  }

  async saveCategory(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('cat-form-name');
    const descInput = document.getElementById('cat-form-desc');
    const name = nameInput ? nameInput.value.trim() : '';
    const description = descInput ? descInput.value.trim() : '';

    if (!name) {
      window.app.showToast('Vui lòng nhập tên danh mục!', 'error');
      return;
    }

    const payload = { name, description };

    try {
      if (this.editingCategoryId) {
        await window.api.updateCategory(this.editingCategoryId, payload);
        window.app.showToast('Cập nhật danh mục thành công!', 'success');
      } else {
        await window.api.createCategory(payload);
        window.app.showToast('Thêm danh mục mới thành công!', 'success');
      }

      this.closeCategoryModal();
      await this.loadCategories();
      if (window.productsManager && typeof window.productsManager.loadCategories === 'function') {
        await window.productsManager.loadCategories();
      }
      if (window.pos && typeof window.pos.loadCategories === 'function') {
        await window.pos.loadCategories();
      }
    } catch (err) {
      console.error(err);
      window.app.showToast(err.message || 'Lỗi khi lưu danh mục', 'error');
    }
  }

  // ==================== SUPPLIERS ====================
  async loadSuppliers() {
    this.suppliers = await window.api.getSuppliers();
    this.renderSuppliersTable();
  }

  renderSuppliersTable() {
    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return;

    if (!this.suppliers || this.suppliers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
            <div style="font-size: 24px; margin-bottom: 8px;">🏢</div>
            Chưa có nhà cung cấp nào. Bấm <strong>"+ Thêm Nhà Cung Cấp"</strong> để tạo mới.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.suppliers.map((s, idx) => {
      const isActive = !s.status || s.status === 'ACTIVE';
      const statusBadge = isActive
        ? '<span class="badge badge-success">🤝 Hợp tác</span>'
        : '<span class="badge badge-error">🚫 Ngừng hợp tác</span>';
      return `
      <tr>
        <td><code>NCC${(s.id || idx + 1).toString().padStart(3, '0')}</code></td>
        <td style="font-weight: 600;">${s.name}</td>
        <td>${s.contact_person || '—'}</td>
        <td>${s.phone || '—'}</td>
        <td>${s.email || '—'}</td>
        <td>${s.address || '—'}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-outline btn-sm" onclick="window.management.openSupplierModal(${s.id})" title="Chỉnh sửa nhà cung cấp">
              ✏️ Sửa
            </button>
            <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}" onclick="window.management.toggleSupplierStatus(${s.id})" title="${isActive ? 'Ngừng hợp tác' : 'Hợp tác trở lại'}" style="font-size: 12px;">
              ${isActive ? '🚫 Ngừng' : '🤝 Hợp tác'}
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }

  openSupplierModal(supId = null) {
    const modal = document.getElementById('supplier-modal');
    const title = document.getElementById('supplier-modal-title');
    const saveBtn = document.getElementById('btn-save-supplier');
    if (!modal) return;

    const sup = supId ? this.suppliers.find(s => s.id == supId) : null;
    this.editingSupplierId = sup ? sup.id : null;

    if (title) {
      title.textContent = sup ? '✏️ Chỉnh Sửa Nhà Cung Cấp' : '🏢 Thêm Nhà Cung Cấp Mới';
    }
    if (saveBtn) {
      saveBtn.textContent = sup ? 'Cập Nhật Nhà Cung Cấp' : 'Lưu Nhà Cung Cấp';
    }

    const idInput = document.getElementById('sup-form-id');
    const nameInput = document.getElementById('sup-form-name');
    const contactInput = document.getElementById('sup-form-contact');
    const phoneInput = document.getElementById('sup-form-phone');
    const emailInput = document.getElementById('sup-form-email');
    const addressInput = document.getElementById('sup-form-address');
    const noteInput = document.getElementById('sup-form-note');
    const statusSelect = document.getElementById('sup-form-status');

    if (idInput) idInput.value = sup ? sup.id : '';
    if (nameInput) nameInput.value = sup ? sup.name : '';
    if (contactInput) contactInput.value = sup ? (sup.contact_person || '') : '';
    if (phoneInput) phoneInput.value = sup ? (sup.phone || '') : '';
    if (emailInput) emailInput.value = sup ? (sup.email || '') : '';
    if (addressInput) addressInput.value = sup ? (sup.address || '') : '';
    if (noteInput) noteInput.value = sup ? (sup.note || '') : '';
    if (statusSelect) statusSelect.value = sup ? (sup.status || 'ACTIVE') : 'ACTIVE';

    modal.classList.add('active');
    setTimeout(() => nameInput?.focus(), 100);
  }

  closeSupplierModal() {
    const modal = document.getElementById('supplier-modal');
    if (modal) modal.classList.remove('active');
    this.editingSupplierId = null;
    document.getElementById('supplier-form')?.reset();
  }

  async saveSupplier(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('sup-form-name')?.value.trim();
    const contact_person = document.getElementById('sup-form-contact')?.value.trim() || null;
    const phone = document.getElementById('sup-form-phone')?.value.trim() || null;
    const email = document.getElementById('sup-form-email')?.value.trim() || null;
    const address = document.getElementById('sup-form-address')?.value.trim() || null;
    const note = document.getElementById('sup-form-note')?.value.trim() || null;
    const status = document.getElementById('sup-form-status')?.value || 'ACTIVE';

    if (!name) {
      window.app.showToast('Vui lòng nhập tên nhà cung cấp!', 'error');
      return;
    }

    const payload = { name, contact_person, phone, email, address, note, status };

    try {
      if (this.editingSupplierId) {
        await window.api.updateSupplier(this.editingSupplierId, payload);
        window.app.showToast('Cập nhật nhà cung cấp thành công!', 'success');
      } else {
        await window.api.createSupplier(payload);
        window.app.showToast('Thêm nhà cung cấp mới thành công!', 'success');
      }

      this.closeSupplierModal();
      await this.loadSuppliers();
      if (window.importsManager && typeof window.importsManager.loadSuppliers === 'function') {
        await window.importsManager.loadSuppliers();
      }
    } catch (err) {
      console.error(err);
      window.app.showToast(err.message || 'Lỗi khi lưu nhà cung cấp', 'error');
    }
  }

  async toggleSupplierStatus(supId) {
    const sup = this.suppliers.find(s => s.id == supId);
    if (!sup) return;
    const newStatus = (!sup.status || sup.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    const label = newStatus === 'ACTIVE' ? 'hợp tác trở lại' : 'ngừng hợp tác';
    try {
      await window.api.updateSupplier(supId, { ...sup, status: newStatus });
      sup.status = newStatus;
      this.renderSuppliersTable();
      window.app.showToast(`Đã cập nhật nhà cung cấp ${sup.name} sang trạng thái ${label}!`, 'success');
    } catch (err) {
      console.error(err);
      window.app.showToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  }

  // ==================== USERS ====================
  async loadUsers() {
    this.users = await window.api.getUsers();
    this.renderUsersTable();
  }

  renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (!this.users || this.users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
            <div style="font-size: 24px; margin-bottom: 8px;">👤</div>
            Chưa có tài khoản nào. Bấm <strong>"+ Thêm Nhân Viên Mới"</strong> để tạo.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.users.map(u => {
      let roleBadge = '<span class="badge badge-primary">Admin</span>';
      if (u.role === 'MANAGER') roleBadge = '<span class="badge badge-info">Quản lý</span>';
      else if (u.role === 'CASHIER') roleBadge = '<span class="badge badge-warning">Thu ngân</span>';
      else if (u.role === 'CUSTOMER') roleBadge = '<span class="badge badge-neutral">Khách hàng</span>';

      return `
        <tr>
          <td><code>#${u.id}</code></td>
          <td style="font-weight: 600;">${u.full_name}</td>
          <td><code style="color: var(--primary);">${u.username}</code></td>
          <td>${u.email || '—'}</td>
          <td>${u.phone || '—'}</td>
          <td>${roleBadge}</td>
          <td>
            <span class="badge ${u.is_active ? 'badge-success' : 'badge-error'}">
              ${u.is_active ? 'Đang hoạt động' : 'Bị khóa'}
            </span>
          </td>
          <td>${u.created_at || '—'}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.management.toggleUserStatus(${u.id})">
              ${u.is_active ? '🔒 Khóa' : '🔓 Mở'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  openUserModal() {
    const modal = document.getElementById('user-modal');
    if (!modal) return;

    document.getElementById('user-form')?.reset();
    const roleSelect = document.getElementById('user-form-role');
    if (roleSelect) roleSelect.value = 'CASHIER';

    modal.classList.add('active');
    setTimeout(() => document.getElementById('user-form-username')?.focus(), 100);
  }

  closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) modal.classList.remove('active');
    document.getElementById('user-form')?.reset();
  }

  async saveUser(e) {
    if (e) e.preventDefault();
    const username = document.getElementById('user-form-username')?.value.trim();
    const password = document.getElementById('user-form-password')?.value.trim();
    const fullName = document.getElementById('user-form-fullname')?.value.trim();
    const role = document.getElementById('user-form-role')?.value || 'CASHIER';
    const phone = document.getElementById('user-form-phone')?.value.trim();
    const email = document.getElementById('user-form-email')?.value.trim();

    if (!username || username.length < 3) {
      window.app.showToast('Tên đăng nhập phải có ít nhất 3 ký tự (chữ và số)!', 'error');
      return;
    }
    if (!password || password.length < 6) {
      window.app.showToast('Mật khẩu khởi tạo phải có ít nhất 6 ký tự!', 'error');
      return;
    }
    if (!fullName) {
      window.app.showToast('Vui lòng nhập họ và tên nhân viên!', 'error');
      return;
    }

    const payload = {
      username,
      password,
      full_name: fullName,
      role,
    };
    if (phone) payload.phone = phone;
    if (email) payload.email = email;

    try {
      await window.api.createUser(payload);
      window.app.showToast(`Tạo tài khoản nhân viên "${username}" thành công!`, 'success');
      this.closeUserModal();
      await this.loadUsers();
    } catch (err) {
      console.error(err);
      window.app.showToast(err.message || 'Lỗi khi tạo tài khoản nhân viên', 'error');
    }
  }

  async toggleUserStatus(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.is_active ? 0 : 1;
    try {
      await window.api.toggleUserStatus(userId, newStatus === 1);
    } catch (err) {
      console.warn('Lỗi API toggle user status:', err);
    }
    user.is_active = newStatus;
    window.app.showToast(`Đã ${user.is_active ? 'mở khóa' : 'khóa'} tài khoản ${user.username}`, 'info');
    this.renderUsersTable();
  }

  // ==================== SETTINGS ====================
  loadSettings() {
    const storeName = localStorage.getItem('cfg_store_name') || 'VINHMART RETAIL';
    const storePhone = localStorage.getItem('cfg_store_phone') || '0901.234.567';
    const storeAddress = localStorage.getItem('cfg_store_address') || '485 Xa lộ Hà Nội, Q.9, TP.HCM';
    const fefoAlert = localStorage.getItem('cfg_fefo_days') || '30';
    const stockAlert = localStorage.getItem('cfg_min_stock') || '10';

    if (document.getElementById('setting-store-name')) document.getElementById('setting-store-name').value = storeName;
    if (document.getElementById('setting-store-phone')) document.getElementById('setting-store-phone').value = storePhone;
    if (document.getElementById('setting-store-address')) document.getElementById('setting-store-address').value = storeAddress;
    if (document.getElementById('setting-fefo-days')) document.getElementById('setting-fefo-days').value = fefoAlert;
    if (document.getElementById('setting-min-stock')) document.getElementById('setting-min-stock').value = stockAlert;
  }

  saveSettings() {
    const storeName = document.getElementById('setting-store-name').value;
    const storePhone = document.getElementById('setting-store-phone').value;
    const storeAddress = document.getElementById('setting-store-address').value;
    const fefoAlert = document.getElementById('setting-fefo-days').value;
    const stockAlert = document.getElementById('setting-min-stock').value;

    localStorage.setItem('cfg_store_name', storeName);
    localStorage.setItem('cfg_store_phone', storePhone);
    localStorage.setItem('cfg_store_address', storeAddress);
    localStorage.setItem('cfg_fefo_days', fefoAlert);
    localStorage.setItem('cfg_min_stock', stockAlert);

    window.app.showToast('Lưu cấu hình hệ thống thành công!', 'success');
  }

  bindEvents() {
    // Category Modal Events
    document.getElementById('btn-open-add-category')?.addEventListener('click', () => {
      this.openCategoryModal();
    });
    document.getElementById('btn-close-category-modal')?.addEventListener('click', () => {
      this.closeCategoryModal();
    });
    document.getElementById('btn-cancel-category')?.addEventListener('click', () => {
      this.closeCategoryModal();
    });
    document.getElementById('category-form')?.addEventListener('submit', (e) => {
      this.saveCategory(e);
    });
    document.getElementById('category-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'category-modal') this.closeCategoryModal();
    });

    // Supplier Modal Events
    document.getElementById('btn-open-add-supplier')?.addEventListener('click', () => {
      this.openSupplierModal();
    });
    document.getElementById('btn-close-supplier-modal')?.addEventListener('click', () => {
      this.closeSupplierModal();
    });
    document.getElementById('btn-cancel-supplier')?.addEventListener('click', () => {
      this.closeSupplierModal();
    });
    document.getElementById('supplier-form')?.addEventListener('submit', (e) => {
      this.saveSupplier(e);
    });
    document.getElementById('supplier-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'supplier-modal') this.closeSupplierModal();
    });

    // User Modal Events
    document.getElementById('btn-open-add-user')?.addEventListener('click', () => {
      this.openUserModal();
    });
    document.getElementById('btn-close-user-modal')?.addEventListener('click', () => {
      this.closeUserModal();
    });
    document.getElementById('btn-cancel-user')?.addEventListener('click', () => {
      this.closeUserModal();
    });
    document.getElementById('user-form')?.addEventListener('submit', (e) => {
      this.saveUser(e);
    });
    document.getElementById('user-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'user-modal') this.closeUserModal();
    });

    // Settings save
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });
  }
}

window.management = new ManagementManager();
