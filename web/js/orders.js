/**
 * web/js/orders.js
 * Quản lý Đơn hàng:
 * - 3 trạng thái chuẩn: Chờ xác nhận (PENDING), Hoàn thành (COMPLETED), Đã hủy (CANCELLED)
 * - Tabs lọc trạng thái: Tất Cả, Chờ Xác Nhận, Hoàn Thành, Đã Hủy
 * - Chỉnh sửa trạng thái đơn hàng qua Modal & nút thao tác
 * - Chi tiết đơn hàng kèm Order Timeline và danh sách mặt hàng
 */

class OrdersManager {
  constructor() {
    this.orders = [];
    this.activeStatus = 'ALL';
    this.currentOrder = null;
  }

  async init() {
    await this.loadOrders();
    this.bindEvents();
  }

  async loadOrders() {
    this.orders = await window.api.getOrders();
    this.renderTable();
  }

  normalizeStatus(status) {
    if (!status) return 'PENDING';
    if (status === 'COMPLETED' || status === 'DELIVERED') return 'COMPLETED';
    if (status === 'CANCELLED') return 'CANCELLED';
    return 'PENDING';
  }

  bindEvents() {
    // Status Tabs
    document.querySelectorAll('.order-status-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.order-status-tab').forEach((t) => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeStatus = e.currentTarget.dataset.status || 'ALL';
        this.renderTable();
      });
    });

    // Close detail modal
    document.getElementById('btn-close-order-modal')?.addEventListener('click', () => {
      document.getElementById('order-detail-modal')?.classList.remove('active');
    });

    // Edit status button from detail modal
    document.getElementById('btn-edit-order-status-from-detail')?.addEventListener('click', () => {
      if (this.currentOrder) {
        this.openChangeStatusModal(this.currentOrder.id);
      }
    });

    // Cancel order button
    document.getElementById('btn-cancel-order')?.addEventListener('click', async () => {
      if (!this.currentOrder) return;
      if (confirm(`Bạn có chắc muốn hủy đơn hàng ${this.currentOrder.order_code}?`)) {
        await this.handleCancelOrder(this.currentOrder.id);
      }
    });

    // Form change status submit
    document.getElementById('change-order-status-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveOrderStatus();
    });
  }

  renderTable() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    let filtered = this.orders;

    if (this.activeStatus !== 'ALL') {
      filtered = filtered.filter((o) => this.normalizeStatus(o.status) === this.activeStatus);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon">🛍️</div>
              <div class="empty-state-title">Không có đơn hàng nào</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((o) => {
        const normStatus = this.normalizeStatus(o.status);
        let statusBadge = '<span class="badge badge-warning">⏳ Chờ xác nhận</span>';
        if (normStatus === 'COMPLETED') {
          statusBadge = '<span class="badge badge-success">✅ Hoàn thành</span>';
        } else if (normStatus === 'CANCELLED') {
          statusBadge = '<span class="badge badge-error">❌ Đã hủy</span>';
        }

        let createdAt = o.created_at || '—';
        if (createdAt && createdAt.includes('T')) {
          createdAt = createdAt.replace('T', ' ').slice(0, 19);
        }

        const customerName = o.customer_name || 'Khách vãng lai';
        const paymentMethod = o.payment_method === 'TIEN_MAT' ? 'Tiền mặt' : (o.payment_method || 'Tiền mặt');

        return `
        <tr>
          <td><code style="font-weight: 700; color: var(--primary);">${o.order_code}</code></td>
          <td style="font-weight: 600;">${customerName}</td>
          <td>${o.phone || '—'}</td>
          <td style="font-size: 12.5px;">${createdAt}</td>
          <td style="font-weight: 700; color: var(--primary);">${(Number(o.total_amount) || 0).toLocaleString('vi-VN')}đ</td>
          <td><span class="badge badge-neutral">${paymentMethod}</span></td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="window.ordersManager.viewOrderDetails(${o.id})">
                👁️ Chi tiết
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.ordersManager.openChangeStatusModal(${o.id})" title="Chỉnh sửa trạng thái">
                ✏️ Đổi trạng thái
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');
  }

  async viewOrderDetails(id) {
    let order = this.orders.find((o) => o.id == id);
    if (!order) return;

    // Mở modal và hiển thị trạng thái đang tải
    document.getElementById('order-detail-modal')?.classList.add('active');
    const itemsContainer = document.getElementById('modal-order-items');
    if (itemsContainer) {
      itemsContainer.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 16px; color: var(--text-secondary);">⏳ Đang tải chi tiết sản phẩm...</td></tr>';
    }

    try {
      const fullOrder = await window.api.getOrderById(id);
      if (fullOrder) {
        order = fullOrder;
      }
    } catch (e) {
      console.warn('Lỗi lấy chi tiết đơn hàng:', e);
    }

    this.currentOrder = order;

    document.getElementById('modal-order-code').textContent = order.order_code;
    document.getElementById('modal-order-customer').textContent = order.customer_name || 'Khách vãng lai';
    document.getElementById('modal-order-phone').textContent = order.phone || '—';
    document.getElementById('modal-order-address').textContent = order.address || 'Tại quầy / Mua trực tiếp';
    document.getElementById('modal-order-total').textContent = (Number(order.total_amount) || 0).toLocaleString('vi-VN') + 'đ';
    
    const payMethod = order.payment_method === 'TIEN_MAT' ? 'Tiền mặt' : (order.payment_method || 'Tiền mặt');
    const payStatus = order.payment?.status || order.payment_status || (order.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING');
    document.getElementById('modal-order-payment').textContent = `${payMethod} (${payStatus})`;

    // Render Timeline theo 3 trạng thái
    const normStatus = this.normalizeStatus(order.status);
    const timelineContainer = document.getElementById('order-timeline-steps');
    if (timelineContainer) {
      if (normStatus === 'CANCELLED') {
        timelineContainer.innerHTML = `
          <div class="timeline-step completed">
            <div class="timeline-circle">✓</div>
            <div class="timeline-label">Chờ xác nhận</div>
          </div>
          <div class="timeline-step active" style="--primary: var(--error);">
            <div class="timeline-circle" style="background: var(--error); border-color: var(--error); color: #fff;">✕</div>
            <div class="timeline-label" style="color: var(--error); font-weight: 700;">Đã hủy đơn</div>
          </div>
        `;
      } else {
        timelineContainer.innerHTML = `
          <div class="timeline-step ${normStatus === 'PENDING' ? 'active' : 'completed'}">
            <div class="timeline-circle">${normStatus === 'COMPLETED' ? '✓' : '1'}</div>
            <div class="timeline-label">Chờ xác nhận</div>
          </div>
          <div class="timeline-step ${normStatus === 'COMPLETED' ? 'completed' : ''}">
            <div class="timeline-circle">${normStatus === 'COMPLETED' ? '✓' : '2'}</div>
            <div class="timeline-label">Hoàn thành</div>
          </div>
        `;
      }
    }

    // Render items
    if (itemsContainer) {
      const items = order.items || [];
      if (items.length === 0) {
        itemsContainer.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 14px;">Không có thông tin chi tiết sản phẩm</td></tr>';
      } else {
        itemsContainer.innerHTML = items
          .map(
            (item) => `
          <tr>
            <td style="font-weight: 600;">
              ${item.product_name || item.name}
              ${item.barcode || item.product_barcode ? `<br><small style="color: var(--text-muted); font-size: 11px;">Mã: ${item.barcode || item.product_barcode}</small>` : ''}
            </td>
            <td>${(Number(item.unit_price || item.price) || 0).toLocaleString('vi-VN')}đ</td>
            <td style="text-align: center; font-weight: 700;">x${item.quantity} ${item.unit || ''}</td>
            <td style="text-align: right; font-weight: 700; color: var(--primary);">${(Number(item.subtotal || ((item.unit_price || item.price) * item.quantity)) || 0).toLocaleString('vi-VN')}đ</td>
          </tr>
        `
          )
          .join('');
      }
    }

    // Disable cancel button if already cancelled
    const cancelBtn = document.getElementById('btn-cancel-order');
    if (cancelBtn) {
      cancelBtn.disabled = normStatus === 'CANCELLED';
    }

  openChangeStatusModal(id) {
    const order = this.orders.find((o) => o.id == id);
    if (!order) return;

    document.getElementById('change-status-order-id').value = order.id;
    document.getElementById('change-status-order-code').textContent = order.order_code;
    document.getElementById('change-status-order-customer').textContent = order.customer_name || 'Khách vãng lai';

    const normStatus = this.normalizeStatus(order.status);
    const select = document.getElementById('change-status-select');
    if (select) select.value = normStatus;

    document.getElementById('change-order-status-modal')?.classList.add('active');
  }

  async saveOrderStatus() {
    const id = document.getElementById('change-status-order-id')?.value;
    const newStatus = document.getElementById('change-status-select')?.value;
    if (!id || !newStatus) return;

    try {
      await window.api.updateOrderStatus(id, newStatus);
      window.app.showToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
      document.getElementById('change-order-status-modal')?.classList.remove('active');

      await this.loadOrders();

      // Nếu đang mở modal chi tiết của đơn này thì cập nhật lại modal chi tiết
      if (this.currentOrder && this.currentOrder.id == id) {
        this.viewOrderDetails(parseInt(id));
      }

      // Làm mới kho hàng nếu có hoàn tồn / trừ tồn
      if (window.inventory) await window.inventory.loadAllData();
      if (window.productsManager) await window.productsManager.loadProducts();
    } catch (e) {
      window.app.showToast(e.message || 'Lỗi cập nhật trạng thái đơn hàng', 'error');
    }
  }

  async handleCancelOrder(id) {
    try {
      await window.api.cancelOrder(id);
      window.app.showToast('Đã hủy đơn hàng thành công!', 'info');
      document.getElementById('order-detail-modal')?.classList.remove('active');
      await this.loadOrders();
      if (window.inventory) await window.inventory.loadAllData();
      if (window.productsManager) await window.productsManager.loadProducts();
    } catch (e) {
      window.app.showToast(e.message || 'Lỗi khi hủy đơn hàng', 'error');
    }
  }
}

window.ordersManager = new OrdersManager();
