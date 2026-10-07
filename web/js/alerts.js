/**
 * web/js/alerts.js
 * Trung Tâm Cảnh Báo Tồn Kho & Hạn Sử Dụng (FEFO Alerts Hub):
 * - Giám sát sản phẩm sắp hết hàng (dưới mức tồn an toàn)
 * - Giám sát sản phẩm đã hết hàng (tồn = 0)
 * - Giám sát lô hàng cận hạn sử dụng (dưới 7, 30, 60 ngày theo FEFO)
 * - Giám sát lô hàng đã hết hạn
 * - Cập nhật số badge cảnh báo trên Sidebar và Chuông thông báo
 * - Thao tác nhanh: Lập phiếu nhập ngay, Đẩy bán tại POS, Xuất file cảnh báo
 */

class AlertsManager {
  constructor() {
    this.lowStockProducts = [];
    this.outOfStockProducts = [];
    this.nearExpiryBatches = [];
    this.expiredBatches = [];
    this.activeFilter = 'ALL';
    this.alertThresholdDays = 30;
  }

  async init() {
    await this.loadAlertsData();
    this.bindEvents();
  }

  async loadAlertsData() {
    try {
      const [allProducts, allBatches] = await Promise.all([
        window.api.getProducts(),
        window.api.getBatches(),
      ]);

      // Phân loại tồn kho
      this.outOfStockProducts = allProducts.filter((p) => (p.stock_quantity ?? 0) <= 0);
      this.lowStockProducts = allProducts.filter(
        (p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.min_stock_level || 10)
      );

      // Phân loại hạn dùng FEFO
      const threshold = parseInt(localStorage.getItem('cfg_fefo_days') || this.alertThresholdDays);
      this.expiredBatches = allBatches.filter((b) => b.days_remaining <= 0 || b.status === 'EXPIRED');
      this.nearExpiryBatches = allBatches.filter(
        (b) => b.days_remaining > 0 && b.days_remaining <= threshold
      );

      this.updateBadges();
      this.renderSummaryCards();
      this.renderAlertsTable();
      this.renderHeaderDropdown();
    } catch (e) {
      console.warn('Lỗi tải dữ liệu cảnh báo:', e);
    }
  }

  updateBadges() {
    const totalAlerts =
      this.outOfStockProducts.length +
      this.lowStockProducts.length +
      this.expiredBatches.length +
      this.nearExpiryBatches.length;

    // Sidebar badge
    const sidebarBadge = document.getElementById('sidebar-alert-badge');
    if (sidebarBadge) {
      sidebarBadge.textContent = totalAlerts;
      sidebarBadge.style.display = totalAlerts > 0 ? 'inline-block' : 'none';
    }

    // Header bell badge
    const headerBellBadge = document.getElementById('header-bell-badge');
    if (headerBellBadge) {
      headerBellBadge.textContent = totalAlerts;
      headerBellBadge.style.display = totalAlerts > 0 ? 'flex' : 'none';
    }
  }

  renderSummaryCards() {
    const cardOutOfStock = document.getElementById('alert-count-out-stock');
    const cardLowStock = document.getElementById('alert-count-low-stock');
    const cardNearExp = document.getElementById('alert-count-near-exp');
    const cardExpired = document.getElementById('alert-count-expired');

    if (cardOutOfStock) cardOutOfStock.textContent = `${this.outOfStockProducts.length} sp`;
    if (cardLowStock) cardLowStock.textContent = `${this.lowStockProducts.length} sp`;
    if (cardNearExp) cardNearExp.textContent = `${this.nearExpiryBatches.length} lô`;
    if (cardExpired) cardExpired.textContent = `${this.expiredBatches.length} lô`;
  }

  renderAlertsTable() {
    const tbody = document.getElementById('alerts-table-body');
    if (!tbody) return;

    let items = [];

    // Gộp dữ liệu theo bộ lọc đang chọn
    if (this.activeFilter === 'ALL' || this.activeFilter === 'OUT_STOCK') {
      this.outOfStockProducts.forEach((p) => {
        items.push({
          type: 'OUT_STOCK',
          level: 'CRITICAL',
          code: p.sku || p.product_code,
          name: p.name,
          category: p.category_name || 'Khác',
          detail: `Tồn kho: <strong>0 ${p.unit || 'sp'}</strong> (Min: ${p.min_stock_level || 10})`,
          shelf: p.shelf_label || 'Kệ chính',
          badgeText: 'Hết hàng (0 sp)',
          badgeClass: 'badge-error',
          actionText: '📥 Nhập hàng ngay',
          actionHandler: `window.alertsManager.quickPurchaseOrder(${p.id})`,
        });
      });
    }

    if (this.activeFilter === 'ALL' || this.activeFilter === 'LOW_STOCK') {
      this.lowStockProducts.forEach((p) => {
        items.push({
          type: 'LOW_STOCK',
          level: 'WARNING',
          code: p.sku || p.product_code,
          name: p.name,
          category: p.category_name || 'Khác',
          detail: `Tồn kho: <strong>${p.stock_quantity} ${p.unit || 'sp'}</strong> (Min: ${p.min_stock_level || 10})`,
          shelf: p.shelf_label || 'Kệ chính',
          badgeText: 'Sắp hết hàng',
          badgeClass: 'badge-warning',
          actionText: '📥 Nhập bổ sung',
          actionHandler: `window.alertsManager.quickPurchaseOrder(${p.id})`,
        });
      });
    }

    if (this.activeFilter === 'ALL' || this.activeFilter === 'EXPIRED') {
      this.expiredBatches.forEach((b) => {
        items.push({
          type: 'EXPIRED',
          level: 'CRITICAL',
          code: b.batch_code,
          name: b.product_name,
          category: 'Lô FEFO',
          detail: `HSD: <strong>${b.expiry_date}</strong> (Quá hạn ${Math.abs(b.days_remaining)} ngày)`,
          shelf: b.shelf_label || 'Kho',
          badgeText: 'ĐÃ HẾT HẠN',
          badgeClass: 'badge-error',
          actionText: '🚫 Thu hồi / Hủy lô',
          actionHandler: `alert('Đã tạo phiếu thu hồi lô ${b.batch_code} (${b.quantity} sp)')`,
        });
      });
    }

    if (this.activeFilter === 'ALL' || this.activeFilter === 'NEAR_EXPIRY') {
      this.nearExpiryBatches.forEach((b) => {
        const isUrgent = b.days_remaining <= 7;
        items.push({
          type: 'NEAR_EXPIRY',
          level: isUrgent ? 'CRITICAL' : 'WARNING',
          code: b.batch_code,
          name: b.product_name,
          category: 'Lô FEFO',
          detail: `HSD: <strong>${b.expiry_date}</strong> (Còn ${b.days_remaining} ngày • SL: ${b.quantity})`,
          shelf: b.shelf_label || 'Kho',
          badgeText: isUrgent ? `Cận hạn gấp (${b.days_remaining} ngày)` : `Cận hạn (${b.days_remaining} ngày)`,
          badgeClass: isUrgent ? 'badge-error' : 'badge-warning',
          actionText: '⚡ Đẩy bán POS',
          actionHandler: `window.alertsManager.pushToPos('${b.batch_code}')`,
        });
      });
    }

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state" style="padding: 40px 20px;">
              <div class="empty-state-icon" style="color: var(--success); font-size: 40px;">✅</div>
              <div class="empty-state-title">Tuyệt vời! Không có cảnh báo nào</div>
              <div class="empty-state-desc">Tồn kho của cửa hàng đảm bảo an toàn và không có sản phẩm nào cận hạn sử dụng.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items
      .map(
        (it) => `
      <tr class="${it.level === 'CRITICAL' ? 'row-danger' : 'row-warning'}">
        <td><code style="font-weight: 700; color: var(--text-main);">${it.code}</code></td>
        <td style="font-weight: 600; font-size: 14px;">${it.name}</td>
        <td><span class="badge badge-neutral">${it.category}</span></td>
        <td>${it.detail}</td>
        <td>${it.shelf}</td>
        <td><span class="badge ${it.badgeClass}">${it.badgeText}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="${it.actionHandler}">
            ${it.actionText}
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  }

  renderHeaderDropdown() {
    const listContainer = document.getElementById('header-notification-list');
    if (!listContainer) return;

    const allAlerts = [
      ...this.expiredBatches.map((b) => ({
        icon: '⛔',
        title: `Lô ${b.batch_code} đã hết hạn!`,
        desc: `${b.product_name} • HSD: ${b.expiry_date}`,
        color: 'var(--error)',
      })),
      ...this.outOfStockProducts.map((p) => ({
        icon: '❌',
        title: `Hết hàng: ${p.name}`,
        desc: `Tồn kho = 0 • Cần lập phiếu nhập hàng ngay`,
        color: 'var(--error)',
      })),
      ...this.nearExpiryBatches.map((b) => ({
        icon: '⏳',
        title: `Lô cận hạn FEFO: ${b.product_name}`,
        desc: `Mã lô: ${b.batch_code} • Còn ${b.days_remaining} ngày`,
        color: 'var(--warning)',
      })),
      ...this.lowStockProducts.map((p) => ({
        icon: '⚠️',
        title: `Sắp hết hàng: ${p.name}`,
        desc: `Còn ${p.stock_quantity} sp • Dưới mức tồn tối thiểu`,
        color: 'var(--warning)',
      })),
    ];

    if (allAlerts.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 13px;">
          🎉 Không có thông báo mới!
        </div>
      `;
      return;
    }

    listContainer.innerHTML = allAlerts
      .slice(0, 5)
      .map(
        (a) => `
        <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); display: flex; gap: 10px; align-items: flex-start; cursor: pointer;" onclick="window.app.switchTab('alerts'); document.getElementById('header-notification-popover')?.classList.remove('active');">
          <span style="font-size: 18px;">${a.icon}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 13px; font-weight: 600; color: ${a.color};">${a.title}</div>
            <div style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.desc}</div>
          </div>
        </div>
      `
      )
      .join('');
  }

  quickPurchaseOrder(productId) {
    window.app.switchTab('imports');
    setTimeout(() => {
      if (window.importsManager) {
        window.importsManager.openCreatePoModal();
        const select = document.querySelector('.po-item-prod');
        if (select) {
          select.value = productId;
          select.dispatchEvent(new Event('change'));
        }
      }
    }, 200);
  }

  pushToPos(batchCode) {
    window.app.switchTab('pos');
    window.app.showToast(`Ưu tiên xuất bán lô ${batchCode} theo quy tắc FEFO!`, 'info');
  }

  bindEvents() {
    // Filter tabs
    document.querySelectorAll('.alert-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.alert-filter-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeFilter = e.currentTarget.dataset.type || 'ALL';
        this.renderAlertsTable();
      });
    });

    // Toggle Notification Popover on Header Bell
    const bellBtn = document.getElementById('header-bell-btn');
    const popover = document.getElementById('header-notification-popover');
    if (bellBtn && popover) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popover.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!popover.contains(e.target) && !bellBtn.contains(e.target)) {
          popover.classList.remove('active');
        }
      });
    }

    // Export button
    document.getElementById('btn-export-alerts')?.addEventListener('click', () => {
      window.print();
    });
  }
}

window.alertsManager = new AlertsManager();
