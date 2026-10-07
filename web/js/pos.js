/**
 * web/js/pos.js
 * Quản lý Bán hàng tại quầy POS hoàn chỉnh:
 * 1. Tự động hiển thị đầy đủ danh mục sản phẩm từ Database
 * 2. Đưa các sản phẩm Cảnh báo sắp hết hạn (FEFO) lên HÀNG ĐẦU để ưu tiên bán
 * 3. Quét mã vạch trực tiếp bằng Camera (Html5-QRCode)
 * 4. Giỏ hàng, chiết khấu %, tiền thừa, giữ đơn tạm, in hóa đơn nhiệt và VietQR
 */

class PosManager {
  constructor() {
    this.cart = [];
    this.heldCart = null;
    this.products = [];
    this.categories = [];
    this.batches = [];
    this.activeCategory = 'ALL';
    this.paymentMethod = 'TIEN_MAT';
    this.cashReceived = 0;
    this.discountPercent = 0;

    // Camera scanner state
    this.html5QrCode = null;
    this.isScanning = false;
    this.lastScannedCode = '';
    this.lastScanTime = 0;
  }

  async init() {
    await this.loadCategories();
    await this.loadProducts();
    this.bindEvents();
    this.renderCart();
  }

  // ==================== 1. HIỂN THỊ ĐẦY ĐỦ DANH MỤC ====================
  async loadCategories() {
    try {
      this.categories = await window.api.getCategories();
      this.renderCategoryPills();
    } catch (e) {
      console.warn('Lỗi tải danh mục:', e);
    }
  }

  renderCategoryPills() {
    const container = document.getElementById('pos-cat-pills');
    if (!container) return;

    const iconMap = {
      'Đồ uống': '🥤',
      'Bánh kẹo': '🍪',
      'Mì - Cháo ăn liền': '🍜',
      'Gia vị': '🧂',
      'Vệ sinh cá nhân': '🧴',
      'Thực phẩm khô': '🌾',
      'Đồ hộp': '🥫',
      'Đồ gia dụng': '💡',
      'Thuốc lá': '🚬',
    };

    let html = `
      <button class="pos-cat-btn ${this.activeCategory === 'ALL' ? 'active' : ''}" data-cat="ALL">
        Tất Cả
      </button>
      <button class="pos-cat-btn ${this.activeCategory === 'FEFO_PRIORITY' ? 'active' : ''}" data-cat="FEFO_PRIORITY" style="border-color: #F59E0B; color: #B45309;">
        ⏳ Ưu Tiên Cận Hạn (FEFO)
      </button>
    `;

    this.categories.forEach((cat) => {
      const icon = iconMap[cat.name] || '🏷️';
      const isActive = this.activeCategory === cat.name;
      html += `
        <button class="pos-cat-btn ${isActive ? 'active' : ''}" data-cat="${cat.name}">
          ${icon} ${cat.name}
        </button>
      `;
    });

    container.innerHTML = html;

    // Gắn sự kiện click
    container.querySelectorAll('.pos-cat-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.pos-cat-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.cat || 'ALL';
        this.renderProductGrid();
      });
    });
  }

  // ==================== 2. LOAD SẢN PHẨM & ƯU TIÊN CẬN HẠN LÊN ĐẦU ====================
  async loadProducts() {
    try {
      const [products, batches] = await Promise.all([
        window.api.getProducts(),
        window.api.getBatches(),
      ]);

      this.batches = batches;

      // Tính hạn dùng nhỏ nhất (FEFO) cho từng sản phẩm
      this.products = products.map((p) => {
        const prodBatches = batches.filter(
          (b) => b.product_id === p.id && b.quantity > 0 && b.expiry_date
        );

        if (prodBatches.length > 0) {
          const minDays = Math.min(...prodBatches.map((b) => b.days_remaining));
          const earliestBatch = prodBatches.find((b) => b.days_remaining === minDays);
          return {
            ...p,
            min_days_remaining: minDays,
            earliest_batch: earliestBatch,
            is_near_expiry: minDays <= 30 && minDays > 0,
            is_expired: minDays <= 0,
          };
        }

        return {
          ...p,
          min_days_remaining: 9999,
          earliest_batch: null,
          is_near_expiry: false,
          is_expired: false,
        };
      });

      // SẮP XẾP: Các sản phẩm CẬN HẠN (FEFO) được đưa LÊN ĐẦU TIÊN
      this.products.sort((a, b) => {
        const aInStock = (a.stock_quantity ?? 0) > 0;
        const bInStock = (b.stock_quantity ?? 0) > 0;

        // Còn hàng ưu tiên trước hết hàng
        if (aInStock && !bInStock) return -1;
        if (!aInStock && bInStock) return 1;

        // Sản phẩm cận hạn ưu tiên đưa lên HÀNG ĐẦU
        if (a.is_near_expiry && !b.is_near_expiry) return -1;
        if (!a.is_near_expiry && b.is_near_expiry) return 1;

        // Trong các sản phẩm cận hạn, sản phẩm nào còn ít ngày hơn xếp trước
        if (a.is_near_expiry && b.is_near_expiry) {
          return a.min_days_remaining - b.min_days_remaining;
        }

        return (a.id || 0) - (b.id || 0);
      });

      this.renderProductGrid();
    } catch (e) {
      console.error('Lỗi tải sản phẩm POS:', e);
    }
  }

  renderProductGrid(searchQuery = '') {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;

    let filtered = this.products;

    if (this.activeCategory === 'FEFO_PRIORITY') {
      filtered = filtered.filter((p) => p.is_near_expiry);
    } else if (this.activeCategory !== 'ALL') {
      filtered = filtered.filter((p) => p.category_name === this.activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 10px;">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Không tìm thấy sản phẩm</div>
          <div class="empty-state-desc">Thử tìm kiếm với từ khóa khác hoặc danh mục khác</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((p) => {
        const isOutOfStock = (p.stock_quantity ?? 0) <= 0;
        const isNearExpiry = p.is_near_expiry;

        return `
        <div class="pos-product-card ${isOutOfStock ? 'out-of-stock' : ''} ${isNearExpiry ? 'near-expiry-card' : ''}" 
             onclick="window.pos.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          
          ${
            isNearExpiry
              ? `<div class="fefo-alert-ribbon">⏳ CẬN HSD: Còn ${p.min_days_remaining} ngày (Ưu tiên FEFO)</div>`
              : ''
          }

          <div class="pos-product-image">
            ${p.main_image ? `<img src="${p.main_image}" alt="${p.name}">` : p.icon || '📦'}
          </div>
          
          <div class="pos-product-name" title="${p.name}">${p.name}</div>
          
          <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">
            ${p.earliest_batch ? `Lô: <strong>${p.earliest_batch.batch_code}</strong>` : `SKU: ${p.sku || p.product_code}`}
          </div>

          <div class="pos-product-meta">
            <span class="pos-product-price">${p.selling_price.toLocaleString('vi-VN')}đ</span>
            <span class="pos-product-stock ${isOutOfStock ? 'text-error' : ''}">
              ${isOutOfStock ? 'Hết hàng' : `Tồn: ${p.stock_quantity}`}
            </span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  // ==================== 3. QUÉT MÃ VẠCH BẰNG CAMERA ====================
  async startCameraScanner() {
    const modal = document.getElementById('camera-scanner-modal');
    const resultEl = document.getElementById('camera-scan-result');
    if (!modal) return;

    modal.classList.add('active');

    if (typeof Html5Qrcode === 'undefined') {
      if (resultEl) {
        resultEl.innerHTML = '<span style="color:var(--error);">Lỗi: Chưa tải được thư viện Html5Qrcode</span>';
      }
      return;
    }

    try {
      if (resultEl) resultEl.innerHTML = 'Đang khởi động camera máy tính/điện thoại...';

      // Khởi tạo Html5Qrcode instance
      this.html5QrCode = new Html5Qrcode('camera-scanner-view');

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 160 },
        aspectRatio: 1.333333,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      };

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Tránh quét trùng lặp trong 1.5 giây
          const now = Date.now();
          if (this.lastScannedCode === decodedText && now - this.lastScanTime < 1500) {
            return;
          }
          this.lastScannedCode = decodedText;
          this.lastScanTime = now;

          if (resultEl) {
            resultEl.innerHTML = `<span style="color:var(--success);">✅ Đã quét mã: <strong>${decodedText}</strong></span>`;
          }

          // Xử lý thêm sản phẩm vào giỏ
          await this.handleBarcodeScan(decodedText);
        },
        (errorMessage) => {
          // Bỏ qua lỗi tìm kiếm frame bình thường
        }
      );

      if (resultEl) {
        resultEl.innerHTML = '<span style="color:var(--primary);">📷 Camera đang hoạt động. Hãy đưa mã vạch vào khung quét!</span>';
      }
      this.isScanning = true;
    } catch (err) {
      console.error('Lỗi khởi động camera:', err);
      if (resultEl) {
        resultEl.innerHTML = `
          <div style="color:var(--error); font-size:12.5px;">
            ❌ Không thể mở camera: ${err.message || err}.<br>
            Vui lòng cấp quyền Camera trên trình duyệt hoặc sử dụng thiết bị có webcam!
          </div>
        `;
      }
    }
  }

  async stopCameraScanner() {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch (e) {
        console.warn('Lỗi dừng camera:', e);
      }
    }
    this.isScanning = false;
    document.getElementById('camera-scanner-modal')?.classList.remove('active');
  }

  // ==================== 4. XỬ LÝ QUÉT & GIỎ HÀNG ====================
  async handleBarcodeScan(barcode) {
    try {
      if (window.soundEffects) window.soundEffects.playScanBeep();
      const product = await window.api.scanBarcode(barcode);
      if (product) {
        this.addToCart(product);
        window.app.showToast(`Đã thêm: ${product.name}`, 'success');
      }
    } catch (e) {
      if (window.soundEffects) window.soundEffects.playErrorBeep();
      window.app.showToast(e.message || `Không tìm thấy mã vạch: ${barcode}`, 'error');
    }
  }

  addToCart(product) {
    const existing = this.cart.find((item) => item.id === product.id);
    const availableStock = product.stock_quantity ?? 99;

    if (existing) {
      if (existing.quantity >= availableStock) {
        if (window.soundEffects) window.soundEffects.playErrorBeep();
        window.app.showToast(`Kho chỉ còn ${availableStock} ${product.unit || 'sản phẩm'}! Không thể thêm vượt tồn.`, 'warning');
        return;
      }
      existing.quantity += 1;
    } else {
      if (availableStock <= 0) {
        if (window.soundEffects) window.soundEffects.playErrorBeep();
        window.app.showToast(`Sản phẩm "${product.name}" đã hết hàng!`, 'error');
        return;
      }
      this.cart.push({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.selling_price,
        unit: product.unit || 'sp',
        stock: availableStock,
        quantity: 1,
      });
    }

    this.renderCart();
  }

  updateQuantity(productId, delta) {
    const item = this.cart.find((i) => i.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.cart = this.cart.filter((i) => i.id !== productId);
    } else if (newQty > item.stock) {
      if (window.soundEffects) window.soundEffects.playErrorBeep();
      window.app.showToast(`Số lượng trong kho chỉ còn ${item.stock}!`, 'warning');
      return;
    } else {
      item.quantity = newQty;
    }

    this.renderCart();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter((i) => i.id !== productId);
    this.renderCart();
  }

  clearCart() {
    this.cart = [];
    this.cashReceived = 0;
    this.discountPercent = 0;
    const cashInput = document.getElementById('pos-cash-input');
    const discountInput = document.getElementById('pos-discount-input');
    if (cashInput) cashInput.value = '';
    if (discountInput) discountInput.value = '0';
    this.renderCart();
  }

  // Giữ đơn / Mở đơn giữ
  holdCart() {
    if (this.cart.length === 0) {
      window.app.showToast('Giỏ hàng trống, không có đơn để giữ!', 'warning');
      return;
    }
    this.heldCart = [...this.cart];
    this.clearCart();
    document.getElementById('btn-restore-cart')?.removeAttribute('disabled');
    const badge = document.getElementById('held-cart-count');
    if (badge) badge.textContent = '1';
    window.app.showToast('Đã tạm giữ đơn hàng hiện tại để phục vụ khách tiếp theo', 'info');
  }

  restoreCart() {
    if (!this.heldCart || this.heldCart.length === 0) return;
    this.cart = [...this.heldCart];
    this.heldCart = null;
    document.getElementById('btn-restore-cart')?.setAttribute('disabled', 'true');
    const badge = document.getElementById('held-cart-count');
    if (badge) badge.textContent = '0';
    this.renderCart();
    window.app.showToast('Đã mở lại đơn hàng tạm giữ!', 'success');
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getTotalAmount() {
    const subtotal = this.getSubtotal();
    const discount = Math.round((subtotal * this.discountPercent) / 100);
    return Math.max(0, subtotal - discount);
  }

  updateCalculations() {
    const subtotal = this.getSubtotal();
    const total = this.getTotalAmount();
    const change = Math.max(0, this.cashReceived - total);

    const subtotalEl = document.getElementById('pos-subtotal-amount');
    const totalEl = document.getElementById('pos-total-amount');
    const changeEl = document.getElementById('pos-change-amount');
    const checkoutBtn = document.getElementById('btn-checkout');

    if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('vi-VN') + 'đ';
    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';
    if (changeEl) changeEl.textContent = change.toLocaleString('vi-VN') + 'đ';

    if (checkoutBtn) {
      checkoutBtn.disabled = this.cart.length === 0;
    }
  }

  renderCart() {
    const container = document.getElementById('pos-cart-items');
    const badge = document.getElementById('cart-count-badge');
    if (!container) return;

    if (badge) {
      badge.textContent = this.cart.reduce((sum, i) => sum + i.quantity, 0);
    }

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 10px;">
          <div class="empty-state-icon" style="font-size: 36px;">🛒</div>
          <div class="empty-state-title" style="font-size: 14px;">Giỏ hàng trống</div>
          <div class="empty-state-desc" style="font-size: 12px;">Bật camera quét mã vạch hoặc bấm chọn sản phẩm</div>
        </div>
      `;
      this.updateCalculations();
      return;
    }

    container.innerHTML = this.cart
      .map(
        (item) => `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <div class="cart-item-title" title="${item.name}">${item.name}</div>
            <div class="cart-item-unit-price">${item.price.toLocaleString('vi-VN')}đ / ${item.unit}</div>
          </div>
          <div class="cart-stepper">
            <button class="stepper-btn" onclick="window.pos.updateQuantity(${item.id}, -1)">−</button>
            <span class="stepper-qty">${item.quantity}</span>
            <button class="stepper-btn" onclick="window.pos.updateQuantity(${item.id}, 1)">+</button>
          </div>
          <div class="cart-item-subtotal">
            ${(item.price * item.quantity).toLocaleString('vi-VN')}đ
          </div>
          <button class="btn-icon" style="width: 26px; height: 26px; border: none; color: var(--error);" onclick="window.pos.removeFromCart(${item.id})">
            ✕
          </button>
        </div>
      `
      )
      .join('');

    this.updateCalculations();
  }

  // ==================== 5. THANH TOÁN (POS CHECKOUT) ====================
  async handleCheckout() {
    if (this.cart.length === 0) {
      window.app.showToast('Giỏ hàng trống!', 'warning');
      return;
    }

    const total = this.getTotalAmount();

    // Nếu chọn QR Bank -> hiển thị mã VietQR để khách quét
    if (this.paymentMethod === 'CHUYEN_KHOAN') {
      this.showVietQrModal(total);
      return;
    }

    // Nếu chọn Tiền mặt -> kiểm tra tiền khách đưa
    if (this.paymentMethod === 'TIEN_MAT' && this.cashReceived > 0 && this.cashReceived < total) {
      if (window.soundEffects) window.soundEffects.playErrorBeep();
      window.app.showToast('Tiền khách đưa chưa đủ!', 'error');
      return;
    }

    await this.completeCheckoutOrder();
  }

  showVietQrModal(amount) {
    const modal = document.getElementById('vietqr-modal');
    const img = document.getElementById('vietqr-image');
    const amtEl = document.getElementById('vietqr-amount');
    if (!modal) return;

    if (amtEl) amtEl.textContent = amount.toLocaleString('vi-VN') + 'đ';

    // Tạo mã VietQR tự động theo chuẩn Napas 247
    if (img) {
      const orderCode = 'HD' + Date.now().toString().slice(-6);
      img.src = `https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${amount}&addInfo=${orderCode}&accountName=VINHMART%20RETAIL`;
    }

    modal.classList.add('active');
  }

  async completeCheckoutOrder() {
    const total = this.getTotalAmount();
    const payload = {
      items: this.cart.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      })),
      total_amount: total,
      cash_received: this.paymentMethod === 'TIEN_MAT' ? (this.cashReceived || total) : total,
      payment_method: this.paymentMethod,
    };

    try {
      const order = await window.api.createPosOrder(payload);
      if (window.soundEffects) window.soundEffects.playSuccessChime();
      window.app.showToast('✅ Thanh toán thành công! Xuất kho theo chuẩn FEFO.', 'success');

      // Đóng modal QR nếu đang mở
      document.getElementById('vietqr-modal')?.classList.remove('active');

      // Mở modal hóa đơn nhiệt
      this.showReceiptModal(order);

      // Làm mới giỏ & cập nhật sản phẩm
      this.clearCart();
      await this.loadProducts();
    } catch (e) {
      if (window.soundEffects) window.soundEffects.playErrorBeep();
      window.app.showToast(e.message || 'Lỗi thanh toán đơn hàng POS', 'error');
    }
  }

  showReceiptModal(order) {
    const modal = document.getElementById('receipt-modal');
    const body = document.getElementById('receipt-modal-body');
    if (!modal || !body) return;

    const items = order.items || this.cart;
    const itemsRows = items
      .map(
        (i) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>${i.name || i.product_name} x${i.quantity}</span>
          <span style="font-weight: 700;">${((i.price || i.unit_price) * i.quantity).toLocaleString('vi-VN')}đ</span>
        </div>
      `
      )
      .join('');

    body.innerHTML = `
      <div class="thermal-receipt-container">
        <div class="receipt-center">
          <div style="font-size: 15px; font-weight: 800;">VINHMART RETAIL</div>
          <div style="font-size: 11px;">485 Xa lộ Hà Nội, Q.9, TP.HCM</div>
          <div style="font-size: 11px;">Hotline: 0901.234.567</div>
          <div style="font-weight: 700; margin: 8px 0;">HÓA ĐƠN BÁN LẺ</div>
        </div>
        <div class="receipt-line"></div>
        <div style="font-size: 11px;">
          <div>Mã HĐ: <strong>${order.order_code || 'HD' + Date.now().toString().slice(-6)}</strong></div>
          <div>Ngày: ${new Date().toLocaleString('vi-VN')}</div>
          <div>Thu ngân: ${order.cashier_name || 'Thu Ngân 01'}</div>
          <div>PTTT: ${order.payment_method === 'TIEN_MAT' ? 'Tiền mặt' : order.payment_method}</div>
        </div>
        <div class="receipt-line"></div>
        <div>
          ${itemsRows}
        </div>
        <div class="receipt-line"></div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 13px;">
          <span>TỔNG CỘNG:</span>
          <span>${(order.total_amount || 0).toLocaleString('vi-VN')}đ</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
          <span>Tiền khách đưa:</span>
          <span>${(order.cash_received || order.total_amount).toLocaleString('vi-VN')}đ</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700;">
          <span>Tiền thối lại:</span>
          <span>${(order.change_amount || 0).toLocaleString('vi-VN')}đ</span>
        </div>
        <div class="receipt-line"></div>
        <div class="receipt-center" style="font-size: 10.5px;">
          Cảm ơn Quý Khách! Hẹn gặp lại!<br>
          (Xuất kho tự động chuẩn FEFO)
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // ==================== 6. BIND SỰ KIỆN GIAO DIỆN ====================
  bindEvents() {
    // Scanner input text
    const scanInput = document.getElementById('pos-barcode-input');
    if (scanInput) {
      scanInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const code = scanInput.value.trim();
          if (code) {
            await this.handleBarcodeScan(code);
            scanInput.value = '';
            this.renderProductGrid('');
          }
        }
      });

      // Lọc danh sách sản phẩm theo thời gian thực khi gõ tìm kiếm
      scanInput.addEventListener('input', (e) => {
        this.renderProductGrid(e.target.value.trim());
      });
    }

    // Button Bật Camera Quét Mã
    document.getElementById('btn-open-camera-scanner')?.addEventListener('click', () => {
      this.startCameraScanner();
    });

    // Button Đóng Camera
    document.getElementById('btn-close-camera')?.addEventListener('click', () => {
      this.stopCameraScanner();
    });
    document.getElementById('btn-stop-camera')?.addEventListener('click', () => {
      this.stopCameraScanner();
    });

    // Quick scan simulate button
    document.getElementById('btn-simulate-scan')?.addEventListener('click', () => {
      if (this.products.length > 0) {
        const rand = this.products[Math.floor(Math.random() * this.products.length)];
        this.handleBarcodeScan(rand.barcode);
      }
    });

    // Search input filtering
    document.getElementById('pos-search-input')?.addEventListener('input', (e) => {
      this.renderProductGrid(e.target.value.trim());
    });

    // Clear cart button
    document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
      if (this.cart.length > 0 && confirm('Bạn có chắc muốn hủy giỏ hàng hiện tại?')) {
        this.clearCart();
        window.app.showToast('Đã xóa giỏ hàng', 'info');
      }
    });

    // Hold / Restore buttons
    document.getElementById('btn-hold-cart')?.addEventListener('click', () => {
      this.holdCart();
    });
    document.getElementById('btn-restore-cart')?.addEventListener('click', () => {
      this.restoreCart();
    });

    // Discount input
    document.getElementById('pos-discount-input')?.addEventListener('input', (e) => {
      this.discountPercent = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
      this.updateCalculations();
    });

    // Cash received input
    const cashInput = document.getElementById('pos-cash-input');
    if (cashInput) {
      cashInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
        this.cashReceived = val;
        this.updateCalculations();
      });
    }

    // Quick cash suggestion chips
    document.querySelectorAll('.cash-chip-btn').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const amount = e.currentTarget.dataset.amount;
        const total = this.getTotalAmount();
        if (amount === 'exact') {
          this.cashReceived = total;
        } else {
          this.cashReceived += parseInt(amount);
        }
        if (cashInput) cashInput.value = this.cashReceived.toLocaleString('vi-VN');
        this.updateCalculations();
      });
    });

    // Payment method tabs
    document.querySelectorAll('.pay-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pay-tab-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.paymentMethod = e.currentTarget.dataset.method;
        this.updateCalculations();
      });
    });

    // Checkout button
    document.getElementById('btn-checkout')?.addEventListener('click', () => {
      this.handleCheckout();
    });

    // VietQR Modal buttons
    document.getElementById('btn-close-vietqr')?.addEventListener('click', () => {
      document.getElementById('vietqr-modal')?.classList.remove('active');
    });
    document.getElementById('btn-confirm-vietqr')?.addEventListener('click', async () => {
      await this.completeCheckoutOrder();
    });

    // Close Receipt Modal
    document.getElementById('btn-close-receipt')?.addEventListener('click', () => {
      document.getElementById('receipt-modal')?.classList.remove('active');
    });

    // Print Receipt
    document.getElementById('btn-print-receipt')?.addEventListener('click', () => {
      window.print();
    });
  }
}

window.pos = new PosManager();
