/**
 * web/js/reports.js
 * Quản lý Báo cáo & Phân tích Doanh thu, Lợi nhuận gộp COGS
 */

class ReportsManager {
  async init() {
    await this.loadDashboardCards();
    this.renderRevenueChart();
    this.renderTopProducts();
  }

  async loadDashboardCards() {
    try {
      const data = await window.api.getDashboard();

      const revEl = document.getElementById('stat-today-revenue');
      const orderEl = document.getElementById('stat-today-orders');
      const lowEl = document.getElementById('stat-low-stock');
      const expEl = document.getElementById('stat-expiring-soon');

      if (revEl) revEl.textContent = (data.today_revenue || 0).toLocaleString('vi-VN') + 'đ';
      if (orderEl) orderEl.textContent = (data.today_orders || 0) + ' đơn';
      if (lowEl) lowEl.textContent = (data.low_stock || 0) + ' sp';
      if (expEl) expEl.textContent = (data.expiring_soon || 0) + ' lô';
    } catch (e) {
      console.warn('Lỗi dashboard:', e);
    }
  }

  async renderRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 600;
    const height = 260;
    canvas.width = width;
    canvas.height = height;

    const data = await window.api.getRevenueReport();
    if (!data || data.length === 0) return;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const pX = 60;
    const pY = 40;
    const chartW = width - pX - 20;
    const chartH = height - pY * 2;

    const maxVal = Math.max(...data.map((d) => d.revenue)) * 1.2;

    // Draw grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pY + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pX, y);
      ctx.lineTo(pX + chartW, y);
      ctx.stroke();

      const labelVal = Math.round((maxVal * (4 - i)) / 4 / 1000) + 'k';
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(labelVal, 10, y + 4);
    }

    // Points & Path
    const points = data.map((d, i) => {
      const x = pX + (chartW / (data.length - 1)) * i;
      const y = pY + chartH - (d.revenue / maxVal) * chartH;
      return { x, y, val: d.revenue, label: d.date.slice(5) };
    });

    // Gradient Area under curve
    const grad = ctx.createLinearGradient(0, pY, 0, pY + chartH);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, pY + chartH);
    ctx.lineTo(points[0].x, pY + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Data points & X labels
    points.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pt.label, pt.x, pY + chartH + 20);
    });
  }

  renderTopProducts() {
    const list = document.getElementById('top-products-list');
    if (!list) return;

    const topItems = [
      { name: 'Coca-Cola lon 330ml', sold: 128, revenue: 1024000, margin: '25%' },
      { name: 'Mì Hảo Hảo tôm chua cay', sold: 115, revenue: 575000, margin: '36%' },
      { name: 'Snack Poca vị phô mai', sold: 84, revenue: 1008000, margin: '33%' },
      { name: 'Sữa Vinamilk tươi 1L', sold: 62, revenue: 1736000, margin: '21%' },
      { name: 'Pepsi lon 330ml', sold: 58, revenue: 435000, margin: '26%' },
    ];

    list.innerHTML = topItems
      .map(
        (item, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 26px; height: 26px; border-radius: 50%; background: ${idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : 'var(--bg-surface)'}; color: #000; font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 12px;">
            ${idx + 1}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 13.5px;">${item.name}</div>
            <div style="font-size: 11.5px; color: var(--text-dim);">Đã bán: ${item.sold} sp | Tỷ suất LN: <strong style="color: var(--success);">${item.margin}</strong></div>
          </div>
        </div>
        <div style="font-weight: 700; color: #38bdf8;">
          ${item.revenue.toLocaleString('vi-VN')}đ
        </div>
      </div>`
      )
      .join('');
  }
}

window.reports = new ReportsManager();
