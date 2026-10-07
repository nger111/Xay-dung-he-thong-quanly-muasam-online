/**
 * web/js/products.js
 * Quản lý Sản phẩm (Danh sách, Tìm kiếm, Lọc, Thêm mới, Sửa, Xóa)
 */

class ProductsManager {
  constructor() {
    this.products = [];
    this.categories = [];
    this.editingId = null;
  }

  async init() {
    await this.loadCategories();
    await this.loadProducts();
    this.bindEvents();
  }

  async loadCategories() {
    this.categories = await window.api.getCategories();
    const filterSelect = document.getElementById('filter-product-category');
    const formCatSelect = document.getElementById('prod-form-category');

    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">Tất cả danh mục</option>' +
        this.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
    if (formCatSelect) {
      formCatSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>' +
        this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  }

  async loadProducts() {
    this.products = await window.api.getProducts();
    this.renderTable();
  }

  bindEvents() {
    // Search input
    document.getElementById('search-product-input')?.addEventListener('input', () => this.renderTable());
    // Filter Category
    document.getElementById('filter-product-category')?.addEventListener('change', () => this.renderTable());
    // Filter Status
    document.getElementById('filter-product-status')?.addEventListener('change', () => this.renderTable());

    // Open Add Modal
    document.getElementById('btn-open-add-product')?.addEventListener('click', () => {
      this.openProductModal();
    });

    // Close Modal
    document.getElementById('btn-close-product-modal')?.addEventListener('click', () => {
      document.getElementById('product-modal')?.classList.remove('active');
    });

    // Form Submit
    document.getElementById('product-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProduct();
    });
  }

  renderTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    const searchVal = document.getElementById('search-product-input')?.value.toLowerCase().trim() || '';
    const catVal = document.getElementById('filter-product-category')?.value || '';
    const statusVal = document.getElementById('filter-product-status')?.value || '';

    let filtered = this.products;

    if (searchVal) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchVal) ||
        p.barcode.includes(searchVal) ||
        (p.sku && p.sku.toLowerCase().includes(searchVal))
      );
    }

    if (catVal) {
      filtered = filtered.filter(p => p.category_name === catVal);
    }

    if (statusVal) {
      filtered = filtered.filter(p => p.status === statusVal);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state">
              <div class="empty-state-icon">📦</div>
              <div class="empty-state-title">Không tìm thấy sản phẩm nào</div>
              <div class="empty-state-desc">Hãy thử thay đổi điều kiện tìm kiếm hoặc thêm sản phẩm mới</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      let statusBadge = '<span class="badge badge-success">Đang bán</span>';
      if (p.status === 'OUT_OF_STOCK' || (p.stock_quantity ?? 0) <= 0) {
        statusBadge = '<span class="badge badge-error">Hết hàng</span>';
      } else if (p.status === 'INACTIVE') {
        statusBadge = '<span class="badge badge-neutral">Tạm ngưng</span>';
      }

      return `
        <tr>
          <td style="width: 40px;"><input type="checkbox" class="checkbox-input"></td>
          <td style="width: 50px;">
            <div style="width: 36px; height: 36px; background: #F8FAFC; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 18px; border: 1px solid var(--border);">
              ${p.main_image ? `<img src="${p.main_image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">` : p.icon || '📦'}
            </div>
          </td>
          <td><code style="color: var(--primary); font-size: 12px; font-weight: 700;">${p.sku || p.product_code}</code></td>
          <td><code style="font-size: 12px; color: var(--text-secondary);">${p.barcode}</code></td>
          <td style="font-weight: 600;">${p.name}</td>
          <td><span class="badge badge-neutral">${p.category_name || 'Khác'}</span></td>
          <td>${(p.import_price || 0).toLocaleString('vi-VN')}đ</td>
          <td style="font-weight: 700; color: var(--primary);">${p.selling_price.toLocaleString('vi-VN')}đ</td>
          <td>
            <span style="font-weight: 700; ${p.stock_quantity <= (p.min_stock_level || 10) ? 'color: var(--error);' : ''}">
              ${p.stock_quantity}
            </span> ${p.unit || ''}
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-icon" style="width: 30px; height: 30px;" title="Chỉnh sửa" onclick="window.productsManager.editProduct(${p.id})">
                ✏️
              </button>
              <button class="btn-icon" style="width: 30px; height: 30px; color: var(--error);" title="Xóa" onclick="window.productsManager.deleteProduct(${p.id})">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openProductModal(product = null) {
    this.editingId = product ? product.id : null;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    if (!modal) return;

    title.textContent = product ? 'Chỉnh Sửa Thông Tin Sản Phẩm' : 'Thêm Sản Phẩm Mới';

    document.getElementById('prod-form-name').value = product ? product.name : '';
    document.getElementById('prod-form-sku').value = product ? product.sku || product.product_code : '';
    document.getElementById('prod-form-barcode').value = product ? product.barcode : '';
    document.getElementById('prod-form-category').value = product ? (product.category_id || '') : '';
    document.getElementById('prod-form-unit').value = product ? product.unit : 'cái';
    document.getElementById('prod-form-cost').value = product ? product.import_price : '';
    document.getElementById('prod-form-price').value = product ? product.selling_price : '';
    document.getElementById('prod-form-brand').value = product ? (product.brand || '') : '';
    document.getElementById('prod-form-minstock').value = product ? (product.min_stock_level || 10) : 10;
    document.getElementById('prod-form-status').value = product ? product.status : 'ACTIVE';

    modal.classList.add('active');
  }

  editProduct(id) {
    const prod = this.products.find(p => p.id === id);
    if (prod) this.openProductModal(prod);
  }

  async saveProduct() {
    const name = document.getElementById('prod-form-name').value.trim();
    const sku = document.getElementById('prod-form-sku').value.trim();
    const barcode = document.getElementById('prod-form-barcode').value.trim();
    const category_id = parseInt(document.getElementById('prod-form-category').value);
    const unit = document.getElementById('prod-form-unit').value.trim();
    const import_price = parseInt(document.getElementById('prod-form-cost').value) || 0;
    const selling_price = parseInt(document.getElementById('prod-form-price').value) || 0;
    const brand = document.getElementById('prod-form-brand').value.trim();
    const min_stock_level = parseInt(document.getElementById('prod-form-minstock').value) || 10;
    const status = document.getElementById('prod-form-status').value;

    if (!name || !sku || !barcode || selling_price <= 0) {
      window.app.showToast('Vui lòng điền đủ Tên, SKU, Barcode và Giá bán > 0!', 'error');
      return;
    }

    const payload = {
      name,
      sku,
      product_code: sku,
      barcode,
      category_id,
      unit,
      import_price,
      selling_price,
      brand,
      min_stock_level,
      status,
    };

    try {
      if (this.editingId) {
        await window.api.updateProduct(this.editingId, payload);
        window.app.showToast('Cập nhật sản phẩm thành công!', 'success');
      } else {
        await window.api.createProduct(payload);
        window.app.showToast('Thêm sản phẩm mới thành công!', 'success');
      }

      document.getElementById('product-modal')?.classList.remove('active');
      await this.loadProducts();
      if (window.pos) window.pos.loadProducts();
    } catch (e) {
      window.app.showToast(e.message || 'Lỗi lưu sản phẩm', 'error');
    }
  }

  async deleteProduct(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) return;
    try {
      await window.api.deleteProduct(id);
      window.app.showToast('Đã xóa sản phẩm', 'info');
      await this.loadProducts();
      if (window.pos) window.pos.loadProducts();
    } catch (e) {
      window.app.showToast(e.message || 'Lỗi khi xóa sản phẩm', 'error');
    }
  }
}

window.productsManager = new ProductsManager();
