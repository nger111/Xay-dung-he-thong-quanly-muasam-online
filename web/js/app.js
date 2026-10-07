/**
 * web/js/app.js
 * Main App Controller: Tab router, Toasts, Phím tắt, Khởi tạo ứng dụng
 */

class App {
  constructor() {
    this.currentTab = 'pos';
  }

  async init() {
    this.bindTabNavigation();
    this.bindGlobalShortcuts();
    this.checkServerStatus();

    // Khởi tạo các module
    if (window.pos) await window.pos.init();
    if (window.inventory) await window.inventory.init();
    if (window.reports) await window.reports.init();

    // Auto focus barcode input on launch
    const scanInput = document.getElementById('pos-barcode-input');
    if (scanInput) scanInput.focus();
  }

  bindTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Cập nhật tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Cập nhật views
    document.querySelectorAll('.view-section').forEach((view) => {
      view.classList.toggle('active', view.id === `view-${tabName}`);
    });

    // Trigger tab specific refresh
    if (tabName === 'pos') {
      const scanInput = document.getElementById('pos-barcode-input');
      if (scanInput) scanInput.focus();
    } else if (tabName === 'inventory' && window.inventory) {
      window.inventory.loadInventoryData();
    } else if (tabName === 'reports' && window.reports) {
      window.reports.init();
    }
  }

  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // F2: Focus scanner
      if (e.key === 'F2') {
        e.preventDefault();
        this.switchTab('pos');
        const scanInput = document.getElementById('pos-barcode-input');
        if (scanInput) scanInput.focus();
        this.showToast('Đã chọn ô quét mã (F2)', 'info');
      }

      // F4: Thanh toán
      if (e.key === 'F4') {
        e.preventDefault();
        if (this.currentTab === 'pos' && window.pos) {
          window.pos.handleCheckout();
        }
      }

      // Escape: Đóng modal
      if (e.key === 'Escape') {
        const modal = document.getElementById('receipt-modal');
        if (modal && modal.classList.contains('active')) {
          modal.classList.remove('active');
        }
      }
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-weight: bold;">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  async checkServerStatus() {
    const badge = document.getElementById('server-status-badge');
    const dot = document.getElementById('server-status-dot');
    const text = document.getElementById('server-status-text');

    try {
      const res = await fetch('http://localhost:3000/');
      if (res.ok) {
        if (badge) {
          badge.style.background = 'var(--success-light)';
          badge.style.color = 'var(--success)';
          badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        }
        if (dot) dot.style.background = 'var(--success)';
        if (text) text.textContent = 'REST API: Sẵn sàng';
      }
    } catch (e) {
      if (badge) {
        badge.style.background = 'var(--warning-light)';
        badge.style.color = 'var(--warning)';
        badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      }
      if (dot) dot.style.background = 'var(--warning)';
      if (text) text.textContent = 'Demo Mode (Offline)';
    }
  }
}

window.app = new App();

document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
