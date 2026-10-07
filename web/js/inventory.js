/**
 * web/js/inventory.js
 * Quản lý Kho hàng & Giám sát Lô HSD theo nguyên tắc FEFO (First Expired, First Out)
 */

class InventoryManager {
  constructor() {
    this.batches = [];
  }

  async init() {
    await this.loadInventoryData();
  }

  async loadInventoryData() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    try {
      const products = await window.api.getProducts();

      // Giả lập dữ liệu các lô hàng với HSD thực tế
      const batches = [
        { batch_code: 'LOT-202401-01', product_name: 'Coca-Cola lon 330ml', barcode: '8934588012345', quantity: 24, import_price: 6000, expiry_date: '2026-11-15', shelf: 'Kệ A (T1-01)' },
        { batch_code: 'LOT-202402-04', product_name: 'Coca-Cola lon 330ml', barcode: '8934588012345', quantity: 24, import_price: 6100, expiry_date: '2027-02-28', shelf: 'Kệ A (T1-01)' },
        { batch_code: 'LOT-202401-02', product_name: 'Pepsi lon 330ml', barcode: '8934588012346', quantity: 36, import_price: 5500, expiry_date: '2026-12-30', shelf: 'Kệ A (T1-02)' },
        { batch_code: 'LOT-202401-05', product_name: 'Sữa Vinamilk tươi 1L', barcode: '8934822012349', quantity: 10, import_price: 22000, expiry_date: '2026-10-25', shelf: 'Tủ Mát (TM-01)' },
        { batch_code: 'LOT-202402-10', product_name: 'Sữa Vinamilk tươi 1L', barcode: '8934822012349', quantity: 14, import_price: 22000, expiry_date: '2026-11-30', shelf: 'Tủ Mát (TM-01)' },
        { batch_code: 'LOT-202401-08', product_name: 'Nước mắm Nam Ngư 500ml', barcode: '8935024012340', quantity: 20, import_price: 18000, expiry_date: '2027-06-15', shelf: 'Kệ C (T1-01)' },
        { batch_code: 'LOT-202401-07', product_name: 'Snack Poca vị phô mai', barcode: '8936150123457', quantity: 40, import_price: 8000, expiry_date: '2026-11-05', shelf: 'Kệ A (T2-02)' },
      ];

      const today = new Date();

      tableBody.innerHTML = batches
        .map((b) => {
          const exp = new Date(b.expiry_date);
          const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

          let badgeClass = 'status-safe';
          let badgeText = `Còn ${diffDays} ngày`;

          if (diffDays <= 0) {
            badgeClass = 'status-danger';
            badgeText = 'ĐÃ HẾT HẠN';
          } else if (diffDays <= 30) {
            badgeClass = 'status-warning';
            badgeText = `⚠️ Hạn gần: ${diffDays} ngày (Ưu tiên FEFO)`;
          }

          return `
          <tr>
            <td style="font-family: monospace; font-weight: bold; color: #38bdf8;">${b.batch_code}</td>
            <td>
              <div style="font-weight: 600;">${b.product_name}</div>
              <div style="font-size: 11px; color: var(--text-dim); font-family: monospace;">${b.barcode}</div>
            </td>
            <td><strong style="color: #34d399;">${b.quantity}</strong></td>
            <td>${b.import_price.toLocaleString('vi-VN')}đ</td>
            <td>${b.expiry_date}</td>
            <td><span class="fefo-badge ${badgeClass}">${badgeText}</span></td>
            <td><span style="background: var(--bg-surface); padding: 3px 8px; border-radius: 4px; font-size: 12px;">${b.shelf}</span></td>
          </tr>`;
        })
        .join('');
    } catch (e) {
      console.warn('Lỗi tải dữ liệu kho:', e);
    }
  }
}

window.inventory = new InventoryManager();
