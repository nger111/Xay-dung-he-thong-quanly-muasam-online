/**
 * web/js/app.js
 * Main Controller:
 * - Điều hướng màn hình (Router & View Switching)
 * - Quản lý Sidebar (Collapse/Expand, Menu Indicator)
 * - Phân quyền theo Role (ADMIN, MANAGER, CASHIER)
 * - Xác thực & Đăng nhập (Login Modal & Demo Quick Switch)
 * - Toast Notification, Phím tắt F2 (Scan), F4 (Pay), Esc (Đóng)
 */

class App {
  constructor() {
    this.currentTab = 'dashboard';
    this.currentUser = {
      id: 1,
      username: 'admin',
      full_name: 'Quản Trị Viên (Admin)',
      role: 'ADMIN',
    };
  }

  async init() {
    this.loadUserSession();
    this.bindSidebarEvents();
    this.bindTabNavigation();
    this.bindGlobalShortcuts();
    this.bindLoginEvents();
    this.bindHeaderEvents();
    this.checkServerStatus();

    // Khởi tạo các module con
    if (window.dashboard) await window.dashboard.init();
    if (window.pos) await window.pos.init();
    if (window.productsManager) await window.productsManager.init();
    if (window.inventory) await window.inventory.init();
    if (window.importsManager) await window.importsManager.init();
    if (window.ordersManager) await window.ordersManager.init();
    if (window.management) await window.management.init();
    if (window.reports) await window.reports.init();
    if (window.alertsManager) await window.alertsManager.init();

    // Áp dụng quyền của role hiện tại
    this.applyRolePermissions(this.currentUser.role);

    // Bắt đầu đồng bộ đơn hàng thời gian thực từ Mobile sang Web
    this.startRealtimeOrderSync();

    // Mặc định tab ban đầu
    const hash = window.location.hash.replace('#', '');
    this.switchTab(hash || 'dashboard');
  }

  loadUserSession() {
    const stored = localStorage.getItem('pos_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        console.warn('Lỗi đọc user:', e);
      }
    }
    this.updateUserUI();
  }

  updateUserUI() {
    const avatarEl = document.getElementById('header-user-avatar');
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');

    if (nameEl) nameEl.textContent = this.currentUser.full_name || this.currentUser.username;
    if (roleEl) {
      const roleMap = { ADMIN: 'Quản Trị Viên', MANAGER: 'Quản Lý Cửa Hàng', CASHIER: 'Thu Ngân POS' };
      roleEl.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
    }
    if (avatarEl) {
      const initials = (this.currentUser.full_name || this.currentUser.username).slice(0, 2).toUpperCase();
      avatarEl.textContent = initials;
    }

    // Cập nhật chip chọn nhanh role
    document.querySelectorAll('.role-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.role === this.currentUser.role);
    });
  }

  bindSidebarEvents() {
    const sidebar = document.getElementById('app-sidebar');
    const toggleBtn = document.getElementById('btn-toggle-sidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
      });

      if (localStorage.getItem('sidebar_collapsed') === '1') {
        sidebar.classList.add('collapsed');
      }
    }

    // Nút Đăng xuất ở sidebar
    document.getElementById('btn-sidebar-logout')?.addEventListener('click', () => {
      this.handleLogout();
    });
  }

  bindTabNavigation() {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = e.currentTarget.dataset.tab;
        if (tab === 'logout') {
          this.handleLogout();
        } else if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    window.location.hash = tabName;

    // Cập nhật menu active
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Cập nhật section hiển thị
    document.querySelectorAll('.view-section').forEach((view) => {
      view.classList.toggle('active', view.id === `view-${tabName}`);
    });

    // Cập nhật Breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    const titleMap = {
      dashboard: 'Dashboard Tổng Quan',
      pos: 'Bán Hàng POS (F2)',
      products: 'Quản Lý Sản Phẩm',
      categories: 'Quản Lý Danh Mục',
      inventory: 'Kiểm Soát Tồn Kho',
      batches: 'Lô Hàng & Hạn Dùng (FEFO)',
      imports: 'Phiếu Nhập Hàng (PO)',
      suppliers: 'Nhà Cung Cấp',
      orders: 'Đơn Hàng Online',
      alerts: 'Cảnh Báo Tồn Kho & Hạn Dùng (FEFO)',
      users: 'Quản Trị Người Dùng',
      reports: 'Báo Cáo & Doanh Thu',
      settings: 'Cài Đặt Hệ Thống',
    };
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = titleMap[tabName] || tabName;
    }

    // Trigger tab specific action
    if (tabName === 'pos') {
      setTimeout(() => document.getElementById('pos-barcode-input')?.focus(), 150);
    } else if (tabName === 'dashboard' && window.dashboard) {
      window.dashboard.init();
    } else if (tabName === 'inventory' && window.inventory) {
      window.inventory.loadAllData();
    } else if (tabName === 'batches' && window.inventory) {
      window.inventory.loadBatchesData();
    } else if (tabName === 'reports' && window.reports) {
      window.reports.init();
    } else if (tabName === 'alerts' && window.alertsManager) {
      window.alertsManager.loadAlertsData();
    }
  }

  applyRolePermissions(role) {
    this.currentUser.role = role;
    this.updateUserUI();

    // Menu permission map theo yêu cầu tài liệu:
    // ADMIN: Toàn bộ menu
    // MANAGER: Sản phẩm, Danh mục, Kho, Lô hàng, Nhập hàng, Nhà cung cấp, Đơn hàng, Báo cáo, Cài đặt
    // CASHIER: POS, Sản phẩm, Kho, Đơn hàng
    document.querySelectorAll('.nav-item').forEach((item) => {
      const allowedRoles = item.dataset.roles ? item.dataset.roles.split(',') : ['ADMIN', 'MANAGER', 'CASHIER'];
      if (allowedRoles.includes(role)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    // Nếu tab hiện tại không được phép cho role mới, tự chuyển sang tab hợp lệ
    const activeItem = document.querySelector(`.nav-item[data-tab="${this.currentTab}"]`);
    if (activeItem && activeItem.style.display === 'none') {
      if (role === 'CASHIER') this.switchTab('pos');
      else if (role === 'MANAGER') this.switchTab('products');
      else this.switchTab('dashboard');
    }
  }

  bindHeaderEvents() {
    // Quick role switch chips
    document.querySelectorAll('.role-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const role = e.currentTarget.dataset.role;
        const nameMap = { ADMIN: 'Quản Trị Viên (Admin)', MANAGER: 'Quản Lý Cửa Hàng', CASHIER: 'Thu Ngân 01' };
        this.currentUser.role = role;
        this.currentUser.username = role.toLowerCase();
        this.currentUser.full_name = nameMap[role];
        localStorage.setItem('pos_user', JSON.stringify(this.currentUser));
        this.applyRolePermissions(role);
        this.showToast(`Đã chuyển sang vai trò: ${role}`, 'info');
      });
    });

    // Profile badge click opens user modal / options
    document.getElementById('header-user-profile')?.addEventListener('click', () => {
      document.getElementById('login-modal')?.classList.add('active');
    });
  }

  bindLoginEvents() {
    const modal = document.getElementById('login-modal');

    // Close button
    document.getElementById('btn-close-login')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    // Quick demo login buttons in login modal
    document.querySelectorAll('.demo-login-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.dataset.role;
        const u = role === 'ADMIN' ? 'admin' : role === 'MANAGER' ? 'manager1' : 'cashier1';
        document.getElementById('login-username').value = u;
        document.getElementById('login-password').value = 'password';
      });
    });

    // Login form submit
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value.trim();

      if (!u || !p) {
        this.showToast('Vui lòng nhập tài khoản và mật khẩu!', 'warning');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-login');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang đăng nhập...';
      }

      try {
        const res = await window.api.login(u, p);
        if (res?.user) {
          this.currentUser = res.user;
          this.updateUserUI();
          this.applyRolePermissions(this.currentUser.role);
          this.showToast(`Đăng nhập thành công! Xin chào ${this.currentUser.full_name}`, 'success');
          modal?.classList.remove('active');
        }
      } catch (err) {
        this.showToast(err.message || 'Đăng nhập thất bại!', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Đăng Nhập Hệ Thống';
        }
      }
    });
  }

  handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất khỏi hệ thống?')) {
      window.api.logout();
      this.showToast('Đã đăng xuất', 'info');
      document.getElementById('login-modal')?.classList.add('active');
    }
  }

  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // F2: Mở nhanh POS
      if (e.key === 'F2') {
        e.preventDefault();
        this.switchTab('pos');
        const scan = document.getElementById('pos-barcode-input');
        if (scan) scan.focus();
        this.showToast('Đã chuyển sang POS (F2)', 'info');
      }

      // F4: Thanh toán
      if (e.key === 'F4') {
        e.preventDefault();
        if (this.currentTab === 'pos' && window.pos) {
          window.pos.handleCheckout();
        }
      }

      // ESC: Đóng mọi modal
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active, .login-overlay.active').forEach((m) => {
          m.classList.remove('active');
        });
      }
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    toast.innerHTML = `<span style="font-weight: bold; font-size: 16px;">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  startRealtimeOrderSync() {
    this.knownOrderIds = new Set();
    this.hasInitialSync = false;

    const pollOrders = async () => {
      try {
        const orders = await window.api.getOrders();
        if (Array.isArray(orders)) {
          if (!this.hasInitialSync) {
            orders.forEach((o) => this.knownOrderIds.add(String(o.id)));
            this.hasInitialSync = true;
            return;
          }

          const brandNewOrders = orders.filter((o) => !this.knownOrderIds.has(String(o.id)));
          if (brandNewOrders.length > 0) {
            brandNewOrders.forEach((o) => this.knownOrderIds.add(String(o.id)));
            const latest = brandNewOrders[0];

            // Âm thanh thông báo đơn mới
            window.soundEffects?.playSuccessChime();

            // Toast thông báo thời gian thực
            this.showToast(
              `🔔 Đơn hàng mới #${latest.order_code || latest.id} (${Number(latest.total_amount || 0).toLocaleString('vi-VN')}đ) vừa được tạo từ Mobile!`,
              'success'
            );

            // Tự động làm mới giao diện quản lý đơn hàng nếu đang mở
            if (window.ordersManager) {
              window.ordersManager.loadOrders();
            }
            if (window.dashboard && this.currentTab === 'dashboard') {
              window.dashboard.init();
            }
            if (window.reports && this.currentTab === 'reports') {
              window.reports.reload();
            }
          }
        }
      } catch (err) {
        // Bỏ qua lỗi kết nối tạm thời khi thăm dò
      }
    };

    // Chu kỳ thăm dò 3 giây
    setInterval(pollOrders, 3000);
    // Chạy lần đầu khởi tạo
    pollOrders();
  }

  async checkServerStatus() {
    const dot = document.getElementById('server-status-dot');
    const text = document.getElementById('server-status-text');

    try {
      const res = await fetch('http://localhost:3000/');
      if (res.ok) {
        if (dot) dot.style.background = 'var(--success)';
        if (text) text.textContent = 'REST API: Trực tuyến';
      }
    } catch (e) {
      if (dot) dot.style.background = 'var(--warning)';
      if (text) text.textContent = 'REST API: Offline (Mock mode)';
    }
  }
}

window.app = new App();

document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
