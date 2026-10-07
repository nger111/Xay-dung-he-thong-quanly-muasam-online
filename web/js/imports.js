/**
 * web/js/imports.js
 * Quản lý Nhập hàng (Purchase Orders):
 * - Danh sách phiếu nhập hàng (Mã PN, Nhà cung cấp, Ngày nhập, Tổng tiền, Trạng thái)
 * - Tạo phiếu nhập hàng mới với nhiều dòng sản phẩm, tự sinh lô hàng (Batch) & HSD theo FEFO
 */

class ImportsManager {
  constructor() {
    this.purchaseOrders = [];
    this.suppliers = [];
    this.products = [];
    this.newPoItems = [];
  }

  async init() {
    await this.loadData();
    this.bindEvents();
  }

  async loadData() {
    this.purchaseOrders = await window.api.getPurchaseOrders();
    this.suppliers = await window.api.getSuppliers();
    this.products = await window.api.getProducts();
    this.renderTable();
    this.populateSupplierSelect();
  }

  populateSupplierSelect() {
    const select = document.getElementById('po-form-supplier');
    if (select) {
      select.innerHTML = '<option value="">-- Chọn nhà cung cấp --</option>' +
        this.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
  }

  bindEvents() {
    // Open Create Modal
    document.getElementById('btn-open-create-po')?.addEventListener('click', () => {
      this.openCreatePoModal();
    });

    // Close Modal
    document.getElementById('btn-close-po-modal')?.addEventListener('click', () => {
      document.getElementById('create-po-modal')?.classList.remove('active');
    });

    // Add PO item row
    document.getElementById('btn-add-po-item')?.addEventListener('click', () => {
      this.addPoItemRow();
    });

    // Submit PO form
    document.getElementById('create-po-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.savePurchaseOrder();
    });
  }

  renderTable() {
    const tbody = document.getElementById('imports-table-body');
    if (!tbody) return;

    if (this.purchaseOrders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">📥</div>
              <div class="empty-state-title">Chưa có phiếu nhập hàng nào</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.purchaseOrders.map(po => {
      const code = po.po_code || po.receipt_code || `PN${po.id}`;
      const supplierName = po.supplier_name || '—';
      const creatorName = po.creator_name || po.created_by || 'Quản lý';
      let importDate = po.import_date || '—';
      if (importDate && importDate.includes('T')) importDate = importDate.slice(0, 10);
      const itemCount = po.item_count || po.items_count || (po.items ? po.items.length : 1);
      const totalAmount = Number(po.total_amount) || 0;

      return `
        <tr>
          <td><code style="font-weight: 700; color: var(--primary);">${code}</code></td>
          <td style="font-weight: 600;">${supplierName}</td>
          <td>${creatorName}</td>
          <td>${importDate}</td>
          <td><strong>${itemCount} sp</strong></td>
          <td style="font-weight: 700; color: var(--success);">${totalAmount.toLocaleString('vi-VN')}đ</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.importsManager.viewPoDetails(${po.id})">
              👁️ Chi tiết
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  openCreatePoModal() {
    this.newPoItems = [];
    document.getElementById('po-form-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('po-form-note').value = '';
    this.addPoItemRow(); // Add 1 initial row
    document.getElementById('create-po-modal')?.classList.add('active');
  }

  addPoItemRow() {
    const container = document.getElementById('po-items-table-body');
    if (!container) return;

    const rowId = Date.now() + Math.random().toString().slice(2, 5);
    const tr = document.createElement('tr');
    tr.id = `po-row-${rowId}`;

    const prodOptions = this.products.map(p =>
      `<option value="${p.id}" data-cost="${p.import_price || 0}">${p.name} (${p.unit || 'sp'})</option>`
    ).join('');

    tr.innerHTML = `
      <td>
        <select class="form-control po-item-prod" onchange="window.importsManager.handlePoProdChange('${rowId}', this)">
          <option value="">-- Chọn SP --</option>
          ${prodOptions}
        </select>
      </td>
      <td>
        <input type="number" class="form-control po-item-qty" value="10" min="1" style="width: 80px;" oninput="window.importsManager.calculatePoTotals()">
      </td>
      <td>
        <input type="number" class="form-control po-item-cost" value="0" min="0" style="width: 110px;" oninput="window.importsManager.calculatePoTotals()">
      </td>
      <td>
        <input type="text" class="form-control po-item-batch" value="LO-${Date.now().toString().slice(-6)}" placeholder="Mã lô" style="width: 120px;">
      </td>
      <td>
        <input type="date" class="form-control po-item-exp" value="${new Date(Date.now() + 365*24*3600*1000).toISOString().slice(0, 10)}" style="width: 130px;">
      </td>
      <td class="po-item-subtotal" style="font-weight: 700; width: 110px; text-align: right;">
        0đ
      </td>
      <td style="width: 40px;">
        <button type="button" class="btn-icon" style="border: none; color: var(--error);" onclick="document.getElementById('po-row-${rowId}').remove(); window.importsManager.calculatePoTotals();">
          ✕
        </button>
      </td>
    `;

    container.appendChild(tr);
    this.calculatePoTotals();
  }

  handlePoProdChange(rowId, selectEl) {
    const opt = selectEl.options[selectEl.selectedIndex];
    const cost = opt.dataset.cost || 0;
    const row = document.getElementById(`po-row-${rowId}`);
    if (row) {
      row.querySelector('.po-item-cost').value = cost;
      this.calculatePoTotals();
    }
  }

  calculatePoTotals() {
    let grandTotal = 0;
    document.querySelectorAll('#po-items-table-body tr').forEach(row => {
      const qty = parseInt(row.querySelector('.po-item-qty')?.value) || 0;
      const cost = parseInt(row.querySelector('.po-item-cost')?.value) || 0;
      const subtotal = qty * cost;
      grandTotal += subtotal;
      const subtotalEl = row.querySelector('.po-item-subtotal');
      if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('vi-VN') + 'đ';
    });

    const totalEl = document.getElementById('po-form-total-amount');
    if (totalEl) totalEl.textContent = grandTotal.toLocaleString('vi-VN') + 'đ';
  }

  async savePurchaseOrder() {
    const supplierSelect = document.getElementById('po-form-supplier');
    const supplier_id = supplierSelect.value;
    const supplier_name = supplierSelect.options[supplierSelect.selectedIndex]?.text;
    const import_date = document.getElementById('po-form-date').value;
    const note = document.getElementById('po-form-note').value;

    if (!supplier_id) {
      window.app.showToast('Vui lòng chọn Nhà cung cấp!', 'warning');
      return;
    }

    const rows = document.querySelectorAll('#po-items-table-body tr');
    if (rows.length === 0) {
      window.app.showToast('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu nhập!', 'warning');
      return;
    }

    const items = [];
    let grandTotal = 0;

    for (const row of rows) {
      const prodId = row.querySelector('.po-item-prod')?.value;
      const qty = parseInt(row.querySelector('.po-item-qty')?.value) || 0;
      const cost = parseInt(row.querySelector('.po-item-cost')?.value) || 0;
      const batchCode = row.querySelector('.po-item-batch')?.value.trim();
      const expiryDate = row.querySelector('.po-item-exp')?.value;

      if (!prodId) {
        window.app.showToast('Vui lòng chọn sản phẩm cho tất cả các dòng!', 'warning');
        return;
      }

      grandTotal += qty * cost;
      items.push({
        product_id: parseInt(prodId),
        quantity: qty,
        import_price: cost,
        batch_code: batchCode,
        expiry_date: expiryDate,
      });
    }

    const payload = {
      supplier_id: parseInt(supplier_id),
      supplier_name,
      import_date,
      note,
      total_amount: grandTotal,
      items,
    };

    try {
      await window.api.createPurchaseOrder(payload);
      window.app.showToast('Tạo phiếu nhập hàng thành công! Đã thêm vào hàng tồn kho.', 'success');
      document.getElementById('create-po-modal')?.classList.remove('active');
      await this.loadData();
      if (window.inventory) await window.inventory.loadAllData();
      if (window.productsManager) await window.productsManager.loadProducts();
      if (window.pos) await window.pos.loadProducts();
    } catch (e) {
      window.app.showToast(e.message || 'Lỗi lưu phiếu nhập hàng', 'error');
    }
  }

  async viewPoDetails(id) {
    try {
      let po = await window.api.getPurchaseOrderById(id);
      if (!po) {
        po = this.purchaseOrders.find(p => p.id == id);
      }
      if (!po) {
        window.app.showToast('Không tìm thấy thông tin phiếu nhập!', 'error');
        return;
      }

      const code = po.po_code || po.receipt_code || `PN${po.id}`;
      document.getElementById('po-detail-code').textContent = code;
      
      const supEl = document.getElementById('po-detail-supplier');
      if (supEl) supEl.value = po.supplier_name || '—';

      let dateStr = po.import_date || '—';
      if (dateStr && dateStr.includes('T')) {
        dateStr = dateStr.slice(0, 10);
      }
      const dateEl = document.getElementById('po-detail-date');
      if (dateEl) dateEl.value = dateStr;

      const creator = po.creator_name || po.created_by || 'Quản lý';
      const note = po.note ? `${creator} - ${po.note}` : creator;
      const noteEl = document.getElementById('po-detail-note');
      if (noteEl) noteEl.value = note;

      const itemsTbody = document.getElementById('po-detail-items');
      const items = po.items || [];
      
      const countEl = document.getElementById('po-detail-item-count');
      if (countEl) countEl.textContent = `${items.length} mặt hàng`;

      if (items.length === 0) {
        itemsTbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 18px;">
              Chi tiết mặt hàng đang cập nhật
            </td>
          </tr>
        `;
      } else {
        itemsTbody.innerHTML = items.map(item => {
          const prodName = item.product_name || item.name || (this.products.find(p => p.id == item.product_id)?.name) || 'Sản phẩm';
          const unit = item.unit || (this.products.find(p => p.id == item.product_id)?.unit) || 'sp';
          const qty = Number(item.quantity) || 0;
          const price = Number(item.import_price) || 0;
          const subtotal = qty * price;
          const batchCode = item.batch_code || (item.batch_id ? `Lô #${item.batch_id}` : '—');
          let expDate = item.expiry_date || '—';
          if (expDate && expDate.includes('T')) expDate = expDate.slice(0, 10);

          return `
            <tr>
              <td>
                <strong style="color: var(--text-main);">${prodName}</strong>
                <span style="font-size: 11px; color: var(--text-secondary); margin-left: 4px;">(${unit})</span>
              </td>
              <td style="text-align: center; font-weight: 700;">${qty.toLocaleString('vi-VN')}</td>
              <td style="text-align: right;">${price.toLocaleString('vi-VN')}đ</td>
              <td><code style="font-weight: 700; color: var(--primary);">${batchCode}</code></td>
              <td style="white-space: nowrap; font-weight: 500;">${expDate}</td>
              <td style="text-align: right; font-weight: 700; color: var(--success);">${subtotal.toLocaleString('vi-VN')}đ</td>
            </tr>
          `;
        }).join('');
      }

      const totalVal = Number(po.total_amount) || 0;
      document.getElementById('po-detail-total').textContent = totalVal.toLocaleString('vi-VN') + 'đ';

      document.getElementById('po-detail-modal')?.classList.add('active');
    } catch (err) {
      console.error('Lỗi xem chi tiết phiếu nhập:', err);
      window.app.showToast('Không thể mở chi tiết phiếu nhập!', 'error');
    }
  }
}

window.importsManager = new ImportsManager();
