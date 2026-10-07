/**
 * web/js/inventory.js
 * Quản lý Kho hàng — hiển thị danh sách sản phẩm tồn kho
 * Nút "Chi tiết" mở modal hiển thị tất cả lô hàng của sản phẩm đó
 * (số lượng từng lô, hạn sử dụng, trạng thái FEFO)
 *
 * 4 KPI đồng bộ theo sản phẩm:
 *   - Tổng SP trong kho
 *   - Còn hàng
 *   - Sắp hết hàng
 *   - Sắp hết hạn sử dụng
 */

class InventoryManager {
  constructor() {
    this.inventory = [];
    this.batches = [];
    this.suppliers = [];
    this.activeStockFilter = 'ALL'; // 'ALL' | 'CON_HANG' | 'SAP_HET' | 'HET_HANG' | 'SAP_HET_HAN'
  }

  async init() {
    await this.loadAllData();
    this.bindEvents();
  }

  // ── Helpers ─────────────────────────────────────────────

  calculateDaysRemaining(expiryDate) {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  normalizeBatch(b) {
    const days =
      b.days_remaining !== undefined && b.days_remaining !== null
        ? Number(b.days_remaining)
        : this.calculateDaysRemaining(b.expiry_date);

    return {
      ...b,
      id: Number(b.id) || b.id,
      product_id: Number(b.product_id) || b.product_id,
      supplier_id: b.supplier_id ? Number(b.supplier_id) : null,
      quantity: Number(b.quantity) || 0,
      original_quantity: Number(b.original_quantity || b.quantity) || 0,
      days_remaining: days,
    };
  }

  // ── Data Loading ────────────────────────────────────────

  async loadAllData() {
    try {
      const [batches, inventory, suppliers] = await Promise.all([
        window.api.getBatches(),
        window.api.getInventory({ limit: 100 }),
        window.api.getSuppliers(),
      ]);

      this.batches = (batches || []).map((b) => this.normalizeBatch(b));
      this.inventory = inventory || [];
      this.suppliers = suppliers || [];

      this.renderAll();
    } catch (e) {
      console.error('Lỗi tải dữ liệu kho hàng:', e);
    }
  }

  renderAll() {
    const productsWithMeta = this.buildProductsWithMeta();
    this.renderKpis(productsWithMeta);
    this.updateStockTabCounters(productsWithMeta);
    this.renderInventoryTable(productsWithMeta);
  }

  // ── Events ──────────────────────────────────────────────

  bindEvents() {
    // Tìm kiếm sản phẩm tồn kho
    document.getElementById('inventory-search-input')?.addEventListener('input', () => {
      this.renderAll();
    });

    // Lọc tồn kho theo trạng thái
    document.querySelectorAll('.inv-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.inv-filter-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeStockFilter = e.currentTarget.dataset.status || 'ALL';
        this.renderAll();
      });
    });

    // Form điều chỉnh tồn kho
    document.getElementById('stock-adjust-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveStockAdjustment();
    });

    document.getElementById('btn-close-adjust-modal')?.addEventListener('click', () => {
      document.getElementById('stock-adjust-modal')?.classList.remove('active');
    });
  }

  // ── Product-level Helpers ───────────────────────────────

  getProductBatches(productId) {
    return this.batches.filter((b) => b.product_id == productId);
  }

  getValidBatches(productId) {
    return this.batches.filter((b) => {
      if (b.product_id != productId) return false;
      const isExpired = b.status === 'EXPIRED' || (b.days_remaining !== null && b.days_remaining < 0);
      const isDepleted = b.status === 'DEPLETED' || Number(b.quantity) <= 0;
      return !isExpired && !isDepleted;
    });
  }

  getValidStock(productId, fallbackStock = 0) {
    const productBatches = this.getProductBatches(productId);
    if (productBatches.length === 0) {
      return Number(fallbackStock) || 0;
    }
    const validBatches = this.getValidBatches(productId);
    return validBatches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  }

  hasNearExpiryBatch(productId) {
    return this.batches.some((b) => {
      if (b.product_id != productId) return false;
      const isExpired = b.status === 'EXPIRED' || (b.days_remaining !== null && b.days_remaining < 0);
      const isDepleted = b.status === 'DEPLETED' || Number(b.quantity) <= 0;
      if (isExpired || isDepleted) return false;
      return b.days_remaining !== null && b.days_remaining > 0 && b.days_remaining <= 30;
    });
  }

  hasExpiredBatch(productId) {
    return this.batches.some((b) => {
      if (b.product_id != productId) return false;
      return b.status === 'EXPIRED' || (b.days_remaining !== null && b.days_remaining < 0);
    });
  }

  // ── Build product metadata ─────────────────────────────

  buildProductsWithMeta() {
    return this.inventory.map((p) => {
      const validStock = this.getValidStock(p.id, p.stock_quantity);
      const minStock = Number(p.min_stock_level) || 10;
      const productBatches = this.getProductBatches(p.id);
      const validBatches = this.getValidBatches(p.id);
      const hasNear = this.hasNearExpiryBatch(p.id);
      const hasExp = this.hasExpiredBatch(p.id);

      let stockStatus = 'CON_HANG';
      if (validStock <= 0) {
        stockStatus = 'HET_HANG';
      } else if (validStock <= minStock) {
        stockStatus = 'SAP_HET';
      }

      return {
        ...p,
        validStock,
        minStock,
        productBatches,
        validBatches,
        hasNearExpiry: hasNear,
        hasExpired: hasExp,
        stockStatus,
      };
    });
  }

  // ── 1. KPI Cards (đồng bộ theo sản phẩm) ──────────────

  renderKpis(productsWithMeta) {
    const totalEl = document.getElementById('kpi-inv-total-products');
    const inStockEl = document.getElementById('kpi-inv-in-stock');
    const lowStockEl = document.getElementById('kpi-inv-low-stock');
    const nearExpiryEl = document.getElementById('kpi-inv-near-expiry');

    const total = productsWithMeta.length;
    const inStock = productsWithMeta.filter((p) => p.stockStatus === 'CON_HANG').length;
    const lowStock = productsWithMeta.filter((p) => p.stockStatus === 'SAP_HET').length;
    const nearExpiry = productsWithMeta.filter((p) => p.hasNearExpiry).length;

    if (totalEl) totalEl.textContent = `${total} SP`;
    if (inStockEl) inStockEl.textContent = `${inStock} SP`;
    if (lowStockEl) lowStockEl.textContent = `${lowStock} SP`;
    if (nearExpiryEl) nearExpiryEl.textContent = `${nearExpiry} SP`;
  }

  // ── 2. Tab Counters ─────────────────────────────────────

  updateStockTabCounters(productsWithMeta) {
    const totalCount = productsWithMeta.length;
    const conHangCount = productsWithMeta.filter((p) => p.stockStatus === 'CON_HANG').length;
    const sapHetCount = productsWithMeta.filter((p) => p.stockStatus === 'SAP_HET').length;
    const hetHangCount = productsWithMeta.filter((p) => p.stockStatus === 'HET_HANG').length;
    const sapHetHanCount = productsWithMeta.filter((p) => p.hasNearExpiry).length;

    const countAll = document.getElementById('count-inv-all');
    const countConHang = document.getElementById('count-inv-con-hang');
    const countSapHet = document.getElementById('count-inv-sap-het');
    const countHetHang = document.getElementById('count-inv-het-hang');
    const countSapHetHan = document.getElementById('count-inv-sap-het-han');

    if (countAll) countAll.textContent = totalCount;
    if (countConHang) countConHang.textContent = conHangCount;
    if (countSapHet) countSapHet.textContent = sapHetCount;
    if (countHetHang) countHetHang.textContent = hetHangCount;
    if (countSapHetHan) countSapHetHan.textContent = sapHetHanCount;
  }

  // ── 3. Bảng danh sách sản phẩm tồn kho ─────────────────

  renderInventoryTable(productsWithMeta) {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    if (!productsWithMeta) {
      productsWithMeta = this.buildProductsWithMeta();
    }

    const searchVal = document.getElementById('inventory-search-input')?.value.toLowerCase().trim() || '';

    let filtered = productsWithMeta;

    // Lọc theo từ khóa tìm kiếm
    if (searchVal) {
      filtered = filtered.filter((p) => {
        const matchName = (p.name || '').toLowerCase().includes(searchVal);
        const matchBarcode = (p.barcode || '').toLowerCase().includes(searchVal);
        const matchSku = (p.sku || p.product_code || '').toLowerCase().includes(searchVal);
        const matchCat = (p.category_name || '').toLowerCase().includes(searchVal);
        return matchName || matchBarcode || matchSku || matchCat;
      });
    }

    // Lọc theo trạng thái tồn kho
    if (this.activeStockFilter === 'CON_HANG') {
      filtered = filtered.filter((p) => p.stockStatus === 'CON_HANG');
    } else if (this.activeStockFilter === 'SAP_HET') {
      filtered = filtered.filter((p) => p.stockStatus === 'SAP_HET');
    } else if (this.activeStockFilter === 'HET_HANG') {
      filtered = filtered.filter((p) => p.stockStatus === 'HET_HANG');
    } else if (this.activeStockFilter === 'SAP_HET_HAN') {
      filtered = filtered.filter((p) => p.hasNearExpiry);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state" style="padding: 36px 12px;">
              <div class="empty-state-icon">📦</div>
              <div class="empty-state-title">Không tìm thấy sản phẩm tồn kho phù hợp</div>
              <div class="empty-state-desc">Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((p) => {
        // Tình trạng badge
        let statusBadge = '<span class="badge badge-success">✅ Còn hàng</span>';
        if (p.stockStatus === 'HET_HANG') {
          statusBadge = '<span class="badge badge-error">❌ Hết hàng</span>';
        } else if (p.stockStatus === 'SAP_HET') {
          statusBadge = `<span class="badge badge-warning" style="font-weight: 700;">⚠️ Sắp hết (${p.validStock}/${p.minStock})</span>`;
        }

        let alertBadges = '';
        if (p.hasNearExpiry) {
          alertBadges += `<div style="margin-top: 4px;"><span class="badge badge-warning" style="font-size: 10.5px; background: #FEF3C7; color: #B45309; border: 1px solid #FCD34D;" title="Có lô hàng cận hạn sử dụng trong vòng 30 ngày">⏳ Có lô cận hạn</span></div>`;
        }
        if (p.hasExpired) {
          alertBadges += `<div style="margin-top: 3px;"><span class="badge badge-error" style="font-size: 10px;" title="Lô quá hạn đã bị loại trừ khỏi tồn kho hợp lệ">⚠️ Trừ lô quá hạn</span></div>`;
        }

        // Số lô hàng hiện có
        const totalBatches = p.productBatches.length;
        const validBatchCount = p.validBatches.length;
        let batchCountHtml = `<span class="badge badge-neutral" style="font-weight: 600;">${validBatchCount}/${totalBatches} lô</span>`;
        if (totalBatches === 0) {
          batchCountHtml = '<span style="color: var(--text-muted); font-size: 12px; font-style: italic;">Chưa có lô</span>';
        }

        return `
        <tr>
          <td><code style="color: var(--primary); font-weight: 700;">${p.sku || p.product_code}</code></td>
          <td>
            <div style="font-weight: 700; color: var(--text-main); font-size: 13.5px;">${p.name}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Barcode: <code>${p.barcode}</code></div>
          </td>
          <td><span class="badge badge-neutral">${p.category_name || 'Khác'}</span></td>
          <td style="font-weight: 800; font-size: 14.5px; color: ${p.validStock <= 0 ? 'var(--error)' : 'var(--primary-dark)'};">
            ${p.validStock} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">${p.unit || 'sp'}</span>
          </td>
          <td style="color: var(--text-secondary); font-weight: 600;">${p.minStock}</td>
          <td>${batchCountHtml}</td>
          <td>
            ${statusBadge}
            ${alertBadges}
          </td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-outline btn-sm" onclick="window.inventory.openProductStockDetail(${p.id})" title="Xem chi tiết tồn kho theo từng lô">
                🔍 Chi tiết
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.inventory.openAdjustModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.validStock})" title="Điều chỉnh số lượng tồn kho">
                ⚙️ Sửa
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');
  }

  // ── 4. Modal chi tiết tồn kho sản phẩm ─────────────────

  openProductStockDetail(productId) {
    const prod = this.inventory.find((p) => p.id == productId);
    if (!prod) return;

    const modal = document.getElementById('product-stock-detail-modal');
    const titleEl = document.getElementById('product-stock-modal-title');
    const bodyEl = document.getElementById('product-stock-modal-body');
    if (!modal || !bodyEl) return;

    const allBatches = this.getProductBatches(productId);
    const validBatches = this.getValidBatches(productId);
    const validStock = this.getValidStock(productId, prod.stock_quantity);
    const minStock = Number(prod.min_stock_level) || 10;
    const hasNear = this.hasNearExpiryBatch(productId);
    const hasExp = this.hasExpiredBatch(productId);

    if (titleEl) {
      titleEl.textContent = `📦 Chi Tiết Tồn Kho — ${prod.name}`;
    }

    // Tóm tắt sản phẩm
    let stockStatusText = '✅ Còn hàng';
    let stockStatusColor = 'var(--success)';
    if (validStock <= 0) {
      stockStatusText = '❌ Hết hàng';
      stockStatusColor = 'var(--error)';
    } else if (validStock <= minStock) {
      stockStatusText = '⚠️ Sắp hết hàng';
      stockStatusColor = 'var(--warning)';
    }

    let summaryHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div style="background: #F0F9FF; padding: 14px; border-radius: 10px; border: 1px solid #BAE6FD; text-align: center;">
          <div style="font-size: 11px; color: #0369A1; text-transform: uppercase; font-weight: 700;">Tồn Khả Dụng</div>
          <div style="font-size: 28px; font-weight: 800; color: #0284C7; margin-top: 4px;">${validStock}</div>
          <div style="font-size: 11px; color: #0369A1;">${prod.unit || 'sản phẩm'}</div>
        </div>
        <div style="background: #F0FDF4; padding: 14px; border-radius: 10px; border: 1px solid #BBF7D0; text-align: center;">
          <div style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: 700;">Số Lô Hợp Lệ</div>
          <div style="font-size: 28px; font-weight: 800; color: #16A34A; margin-top: 4px;">${validBatches.length}</div>
          <div style="font-size: 11px; color: #166534;">/ ${allBatches.length} tổng lô</div>
        </div>
        <div style="background: ${validStock <= minStock ? '#FEF3C7' : '#F8FAFC'}; padding: 14px; border-radius: 10px; border: 1px solid ${validStock <= minStock ? '#FCD34D' : '#E2E8F0'}; text-align: center;">
          <div style="font-size: 11px; color: ${validStock <= minStock ? '#92400E' : '#64748B'}; text-transform: uppercase; font-weight: 700;">Tình Trạng</div>
          <div style="font-size: 16px; font-weight: 700; color: ${stockStatusColor}; margin-top: 8px;">${stockStatusText}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Tồn tối thiểu: ${minStock}</div>
        </div>
      </div>
    `;

    // Thông tin sản phẩm
    summaryHtml += `
      <div style="background: #F8FAFC; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px;">
        <div><strong>Mã SKU:</strong> <code style="color: var(--primary);">${prod.sku || prod.product_code}</code></div>
        <div><strong>Barcode:</strong> <code>${prod.barcode}</code></div>
        <div><strong>Danh mục:</strong> ${prod.category_name || '—'}</div>
        <div><strong>Đơn vị:</strong> ${prod.unit || 'sp'}</div>
      </div>
    `;

    // Bảng chi tiết các lô hàng
    if (allBatches.length === 0) {
      summaryHtml += `
        <div style="text-align: center; padding: 24px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 8px;">📭</div>
          <div style="font-weight: 600;">Sản phẩm này chưa có lô hàng nào trong kho</div>
        </div>
      `;
    } else {
      // Sắp xếp: lô hợp lệ trước, theo HSD gần nhất (FEFO)
      const sortedBatches = [...allBatches].sort((a, b) => {
        const aExpired = a.status === 'EXPIRED' || (a.days_remaining !== null && a.days_remaining < 0);
        const bExpired = b.status === 'EXPIRED' || (b.days_remaining !== null && b.days_remaining < 0);
        const aDepleted = a.status === 'DEPLETED' || a.quantity <= 0;
        const bDepleted = b.status === 'DEPLETED' || b.quantity <= 0;

        // Lô hợp lệ trước
        const aInvalid = aExpired || aDepleted;
        const bInvalid = bExpired || bDepleted;
        if (aInvalid !== bInvalid) return aInvalid ? 1 : -1;

        // Sắp xếp theo FEFO (HSD gần nhất trước)
        const aDays = a.days_remaining !== null ? a.days_remaining : 99999;
        const bDays = b.days_remaining !== null ? b.days_remaining : 99999;
        return aDays - bDays;
      });

      summaryHtml += `
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 10px; color: var(--text-main);">
          📋 Chi tiết từng lô hàng (${allBatches.length} lô)
        </div>
        <div class="table-responsive" style="max-height: 360px; overflow-y: auto;">
          <table class="custom-table" style="font-size: 13px;">
            <thead>
              <tr style="position: sticky; top: 0; z-index: 1;">
                <th style="min-width: 90px;">Mã Lô</th>
                <th style="min-width: 80px;">Số Lượng</th>
                <th style="min-width: 100px;">Ngày Nhập</th>
                <th style="min-width: 100px;">Hạn Sử Dụng</th>
                <th style="min-width: 90px;">Còn Lại</th>
                <th style="min-width: 80px;">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              ${sortedBatches.map((b, idx) => {
                const isExpired = b.status === 'EXPIRED' || (b.days_remaining !== null && b.days_remaining < 0);
                const isDepleted = b.status === 'DEPLETED' || Number(b.quantity) <= 0;
                const isNearExpiry = !isExpired && !isDepleted && b.days_remaining !== null && b.days_remaining > 0 && b.days_remaining <= 30;

                let rowClass = '';
                if (isExpired) rowClass = 'row-danger';
                else if (isNearExpiry) rowClass = 'row-warning';

                // Trạng thái badge
                let statusBadge = '';
                if (isExpired) {
                  statusBadge = '<span class="badge badge-error">❌ Quá hạn</span>';
                } else if (isDepleted) {
                  statusBadge = '<span class="badge badge-neutral">⚪ Hết hàng</span>';
                } else if (isNearExpiry) {
                  statusBadge = '<span class="badge badge-warning">⚡ Cận hạn</span>';
                } else {
                  statusBadge = '<span class="badge badge-success">✅ Tốt</span>';
                }

                // FEFO countdown
                let fefoBadge = '—';
                if (b.days_remaining !== null) {
                  if (b.days_remaining < 0) {
                    fefoBadge = `<span style="color: var(--error); font-weight: 700;">Quá ${Math.abs(b.days_remaining)} ngày</span>`;
                  } else if (b.days_remaining <= 30) {
                    fefoBadge = `<span style="color: #B45309; font-weight: 700;">⏳ ${b.days_remaining} ngày</span>`;
                  } else {
                    fefoBadge = `<span style="color: var(--success); font-weight: 600;">${b.days_remaining} ngày</span>`;
                  }
                }

                const importDateStr = b.import_date ? b.import_date.slice(0, 10) : '—';
                const expiryDateStr = b.expiry_date ? b.expiry_date.slice(0, 10) : 'Không có HSD';

                return `
                  <tr class="${rowClass}">
                    <td>
                      <code style="font-weight: 800; color: var(--primary-dark); font-size: 12.5px;">${b.batch_code || `LO-${b.id}`}</code>
                    </td>
                    <td>
                      <strong style="font-size: 14px; color: ${b.quantity <= 0 ? 'var(--error)' : 'var(--primary-dark)'};">
                        ${b.quantity}
                      </strong>
                      <span style="font-size: 11px; color: var(--text-muted);">/ ${b.original_quantity || b.quantity}</span>
                    </td>
                    <td style="font-size: 12.5px; white-space: nowrap;">${importDateStr}</td>
                    <td style="font-size: 12.5px; font-weight: 600; white-space: nowrap;">${expiryDateStr}</td>
                    <td style="white-space: nowrap;">${fefoBadge}</td>
                    <td>${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    bodyEl.innerHTML = summaryHtml;
    modal.classList.add('active');
  }

  // ── 5. Modal điều chỉnh tồn kho ─────────────────────────

  openAdjustModal(productId, productName, currentStock) {
    document.getElementById('adjust-product-id').value = productId;
    document.getElementById('adjust-product-name').textContent = productName;
    document.getElementById('adjust-current-stock').textContent = currentStock;
    document.getElementById('adjust-quantity').value = '';
    document.getElementById('adjust-reason').value = 'Kiểm kê định kỳ';
    document.getElementById('stock-adjust-modal')?.classList.add('active');
  }

  async saveStockAdjustment() {
    const id = document.getElementById('adjust-product-id').value;
    const qty = parseInt(document.getElementById('adjust-quantity').value);
    const reason = document.getElementById('adjust-reason').value;

    if (isNaN(qty) || qty === 0) {
      window.app.showToast('Vui lòng nhập số lượng điều chỉnh (+ hoặc -)', 'warning');
      return;
    }

    try {
      await window.api.adjustStock(id, qty, reason);
      window.app.showToast('Điều chỉnh tồn kho thành công!', 'success');
      document.getElementById('stock-adjust-modal')?.classList.remove('active');
      await this.loadAllData();
      if (window.productsManager) window.productsManager.loadProducts();
      if (window.pos) window.pos.loadProducts();
    } catch (e) {
      window.app.showToast(e.message || 'Lỗi điều chỉnh tồn kho', 'error');
    }
  }
}

window.inventory = new InventoryManager();
