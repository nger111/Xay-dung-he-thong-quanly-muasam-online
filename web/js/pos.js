/**
 * web/js/pos.js
 * Quản lý Bán hàng tại quầy POS, Giỏ hàng, Quét mã vạch và In hóa đơn
 */

class PosManager {
  constructor() {
    this.cart = [];
    this.products = [];
    this.activeCategory = 'ALL';
    this.paymentMethod = 'TIEN_MAT';
    this.cashReceived = 0;
  }

  async init() {
    await this.loadProducts();
    this.bindEvents();
    this.renderCart();
  }

  async loadProducts() {
    try {
      this.products = await window.api.getProducts();
      this.renderProductGrid();
    } catch (e) {
      window.app.showToast('Không thể tải danh sách sản phẩm', 'error');
    }
  }

  bindEvents() {
    // Scanner input
    const scanInput = document.getElementById('pos-barcode-input');
    if (scanInput) {
      scanInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const code = scanInput.value.trim();
          if (code) {
            await this.handleBarcodeScan(code);
            scanInput.value = '';
          }
        }
      });
    }

    // Quick scan simulate button
    const btnSimulateScan = document.getElementById('btn-simulate-scan');
    if (btnSimulateScan) {
      btnSimulateScan.addEventListener('click', () => {
        if (this.products.length > 0) {
          const rand = this.products[Math.floor(Math.random() * this.products.length)];
          this.handleBarcodeScan(rand.barcode);
        }
      });
    }

    // Category pills
    document.querySelectorAll('.cat-pill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.cat || 'ALL';
        this.renderProductGrid();
      });
    });

    // Clear cart
    const btnClearCart = document.getElementById('btn-clear-cart');
    if (btnClearCart) {
      btnClearCart.addEventListener('click', () => this.clearCart());
    }

    // Cash received input
    const cashInput = document.getElementById('pos-cash-input');
    if (cashInput) {
      cashInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0;
        this.cashReceived = val;
        this.updatePaymentSummary();
      });
    }

    // Quick cash chips
    document.querySelectorAll('.cash-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.amount;
        const total = this.getTotalAmount();
        if (action === 'exact') {
          this.cashReceived = total;
        } else {
          const add = parseInt(action, 10);
          this.cashReceived = (this.cashReceived || 0) + add;
        }
        if (cashInput) cashInput.value = this.cashReceived ? this.cashReceived.toLocaleString('vi-VN') : '';
        this.updatePaymentSummary();
      });
    });

    // Payment methods
    document.querySelectorAll('.pay-method-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pay-method-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.paymentMethod = e.currentTarget.dataset.method;
      });
    });

    // Checkout button
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
      btnCheckout.addEventListener('click', () => this.handleCheckout());
    }

    // Receipt close & print
    const btnCloseReceipt = document.getElementById('btn-close-receipt');
    if (btnCloseReceipt) {
      btnCloseReceipt.addEventListener('click', () => {
        document.getElementById('receipt-modal').classList.remove('active');
      });
    }
    const btnPrintReceipt = document.getElementById('btn-print-receipt');
    if (btnPrintReceipt) {
      btnPrintReceipt.addEventListener('click', () => window.print());
    }
  }

  async handleBarcodeScan(barcode) {
    try {
      const product = await window.api.scanBarcode(barcode);
      if (product) {
        window.soundEffects.playScanBeep();
        this.addToCart(product);
        window.app.showToast(`Đã thêm: ${product.name}`, 'success');
      }
    } catch (e) {
      window.soundEffects.playErrorBeep();
      window.app.showToast(e.message || 'Không tìm thấy sản phẩm', 'error');
    }
  }

  addToCart(product) {
    const existing = this.cart.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.selling_price || product.price || 0),
        barcode: product.barcode,
        unit: product.unit || 'cái',
        quantity: 1,
      });
    }
    this.renderCart();
  }

  updateQuantity(productId, delta) {
    const item = this.cart.find((i) => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.renderCart();
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter((i) => i.id !== productId);
    this.renderCart();
  }

  clearCart() {
    this.cart = [];
    this.cashReceived = 0;
    const cashInput = document.getElementById('pos-cash-input');
    if (cashInput) cashInput.value = '';
    this.renderCart();
  }

  getTotalAmount() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  renderProductGrid() {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;

    const filtered = this.products.filter((p) => {
      if (this.activeCategory === 'ALL') return true;
      return p.category_name === this.activeCategory;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">
          Không tìm thấy sản phẩm trong danh mục này.
        </div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((p) => {
        const icon = p.icon || '📦';
        const priceFmt = (p.selling_price || p.price || 0).toLocaleString('vi-VN') + 'đ';
        const isLow = p.stock_quantity <= 10;
        return `
        <div class="product-card" onclick="window.pos.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          <span class="product-badge-fefo ${isLow ? 'warning' : ''}">
            ${isLow ? '⚠️ Sắp hết' : '✓ FEFO'}
          </span>
          <div class="product-thumb">${icon}</div>
          <div class="product-name" title="${p.name}">${p.name}</div>
          <div class="product-barcode">${p.barcode}</div>
          <div class="product-card-footer">
            <span class="product-price">${priceFmt}</span>
            <span class="product-stock">Kho: ${p.stock_quantity}</span>
          </div>
        </div>`;
      })
      .join('');
  }

  renderCart() {
    const container = document.getElementById('pos-cart-items');
    const badge = document.getElementById('cart-count-badge');
    const totalCount = this.cart.reduce((sum, i) => sum + i.quantity, 0);

    if (badge) badge.textContent = totalCount;

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-view">
          <div class="empty-cart-icon">🛒</div>
          <div style="font-size: 15px; font-weight: 600; color: var(--text-muted);">Giỏ hàng đang trống</div>
          <div style="font-size: 12px;">Quét mã vạch hoặc bấm chọn sản phẩm bên trái</div>
        </div>`;
      this.updatePaymentSummary();
      return;
    }

    container.innerHTML = this.cart
      .map((item) => {
        const subtotal = (item.price * item.quantity).toLocaleString('vi-VN') + 'đ';
        const priceEach = item.price.toLocaleString('vi-VN') + 'đ';
        return `
        <div class="cart-item-row">
          <div class="cart-item-meta">
            <div class="cart-item-name" title="${item.name}">${item.name}</div>
            <div class="cart-item-unit-price">${priceEach}/${item.unit}</div>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="window.pos.updateQuantity(${item.id}, -1)">-</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" onclick="window.pos.updateQuantity(${item.id}, 1)">+</button>
          </div>
          <div class="cart-item-subtotal">${subtotal}</div>
          <button class="remove-item-btn" onclick="window.pos.removeFromCart(${item.id})">✕</button>
        </div>`;
      })
      .join('');

    this.updatePaymentSummary();
  }

  updatePaymentSummary() {
    const total = this.getTotalAmount();
    const totalEl = document.getElementById('pos-total-amount');
    const changeEl = document.getElementById('pos-change-amount');
    const btnCheckout = document.getElementById('btn-checkout');

    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';

    const change = (this.cashReceived || 0) - total;
    if (changeEl) {
      if (this.cashReceived > 0 && change >= 0) {
        changeEl.textContent = change.toLocaleString('vi-VN') + 'đ';
        changeEl.style.color = 'var(--success)';
      } else if (this.cashReceived > 0 && change < 0) {
        changeEl.textContent = `Thiếu ${Math.abs(change).toLocaleString('vi-VN')}đ`;
        changeEl.style.color = 'var(--danger)';
      } else {
        changeEl.textContent = '0đ';
        changeEl.style.color = 'var(--text-muted)';
      }
    }

    if (btnCheckout) {
      btnCheckout.disabled = this.cart.length === 0;
    }
  }

  async handleCheckout() {
    if (this.cart.length === 0) {
      window.app.showToast('Giỏ hàng trống!', 'error');
      return;
    }

    const total = this.getTotalAmount();
    if (this.paymentMethod === 'TIEN_MAT' && this.cashReceived > 0 && this.cashReceived < total) {
      window.app.showToast('Số tiền khách đưa không đủ!', 'error');
      return;
    }

    const payload = {
      items: this.cart.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      })),
      total_amount: total,
      cash_received: this.cashReceived || total,
      payment_method: this.paymentMethod,
    };

    try {
      const order = await window.api.createPosOrder(payload);
      window.soundEffects.playSuccessChime();
      window.app.showToast('✅ Thanh toán thành công! Xuất kho theo FEFO.', 'success');

      // Mở modal hóa đơn in ấn
      this.showReceiptModal(order);

      // Làm mới giỏ
      this.clearCart();

      // Cập nhật lại kho
      this.loadProducts();
    } catch (e) {
      window.soundEffects.playErrorBeep();
      window.app.showToast(e.message || 'Lỗi khi tạo đơn hàng POS', 'error');
    }
  }

  showReceiptModal(order) {
    const modal = document.getElementById('receipt-modal');
    const body = document.getElementById('receipt-modal-body');
    if (!modal || !body) return;

    const itemsHtml = (order.items || this.cart)
      .map(
        (i) => `
      <tr>
        <td>${i.name || i.product_name} x${i.quantity}</td>
        <td style="text-align: right;">${((i.price || i.unit_price) * i.quantity).toLocaleString('vi-VN')}đ</td>
      </tr>`
      )
      .join('');

    body.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-store-name">VINHMART RETAIL</div>
        <div class="receipt-store-info">485 Xa lộ Hà Nội, Q.9, TP.HCM<br>Hotline: 0901.234.567</div>
      </div>
      <div class="receipt-meta">
        <div>Mã HĐ: <strong>${order.order_code || 'HD20261007_0001'}</strong></div>
        <div>Ngày: ${new Date(order.created_at || Date.now()).toLocaleString('vi-VN')}</div>
        <div>Thu ngân: ${order.cashier_name || 'Thu Ngân 01'}</div>
        <div>Hình thức: ${order.payment_method || 'Tiền mặt'}</div>
      </div>
      <table class="receipt-table">
        <thead>
          <tr>
            <th>Tên hàng</th>
            <th style="text-align: right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="receipt-summary">
        <div style="display: flex; justify-content: space-between;">
          <span>Tổng cộng:</span>
          <strong>${(order.total_amount || 0).toLocaleString('vi-VN')}đ</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Tiền khách đưa:</span>
          <span>${(order.cash_received || 0).toLocaleString('vi-VN')}đ</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Tiền thối:</span>
          <strong>${(order.change_amount || 0).toLocaleString('vi-VN')}đ</strong>
        </div>
      </div>
      <div class="receipt-footer">
        Cảm ơn quý khách và hẹn gặp lại!<br>
        (Áp dụng xuất kho tự động FEFO)
      </div>
    `;

    modal.classList.add('active');
  }
}

window.pos = new PosManager();
