/**
 * web/js/reports.js
 * Quản lý Báo cáo & Thống kê Tài chính
 * - Kết nối trực tiếp API backend /reports/* (với fallback mock nếu offline)
 * - Bộ lọc khoảng thời gian theo tháng linh hoạt: Tháng này, 3 tháng, 6 tháng, 12 tháng hoặc tùy chọn
 * - Biểu đồ doanh thu vs giá vốn (theo tháng / theo ngày)
 * - Top 5 sản phẩm bán chạy nhất theo số lượng & doanh thu
 * - Biểu đồ tròn tỷ trọng doanh thu theo danh mục sản phẩm thực tế
 * - Thẻ chỉ số tài chính (Doanh thu, Giá vốn COGS, Lợi nhuận gộp, Số đơn hoàn tất, Sản phẩm xuất kho)
 */

class ReportsManager {
  constructor() {
    this.revenueChartInstance = null;
    this.categoryChartInstance = null;
    this.currentFromDate = null;
    this.currentToDate = null;
    this.currentView = 'monthly'; // 'monthly' | 'daily'
    this.activeMonths = 1;
    this._initialized = false;
  }

  async init() {
    this._setDefaultDates(1);
    if (!this._initialized) {
      this._bindEvents();
      this._initialized = true;
    }
    await this.reload();
  }

  // ── Tính ngày bắt đầu/kết thúc theo số tháng gần nhất ──
  _setDefaultDates(months) {
    const now = new Date();
    // Cuối tháng hiện tại
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // Đầu tháng của (months - 1) tháng trước
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const fmtISO = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    this.currentFromDate = fmtISO(from);
    this.currentToDate = fmtISO(to);

    // Cập nhật input month
    const fromInput = document.getElementById('report-month-from');
    const toInput = document.getElementById('report-month-to');
    if (fromInput) fromInput.value = this.currentFromDate.slice(0, 7);
    if (toInput) toInput.value = this.currentToDate.slice(0, 7);

    this._updatePeriodLabel(months);
  }

  _updatePeriodLabel(months) {
    const fromD = new Date(this.currentFromDate);
    const toD = new Date(this.currentToDate);
    const fmt = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const text = document.getElementById('report-period-text');
    if (text) {
      if (months === 1) {
        text.textContent = `Tháng ${fmt(toD)}`;
      } else {
        text.textContent = `${fmt(fromD)} → ${fmt(toD)}`;
      }
    }
  }

  _bindEvents() {
    // Nút chọn nhanh số tháng
    document.querySelectorAll('.report-quick-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        document.querySelectorAll('.report-quick-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const months = parseInt(e.currentTarget.dataset.months) || 1;
        this.activeMonths = months;
        this._setDefaultDates(months);
        await this.reload();
      });
    });

    // Nút áp dụng bộ lọc tùy chọn khoảng tháng
    document.getElementById('btn-apply-report-filter')?.addEventListener('click', async () => {
      const fromVal = document.getElementById('report-month-from')?.value;
      const toVal = document.getElementById('report-month-to')?.value;
      if (!fromVal || !toVal) {
        window.app?.showToast('Vui lòng chọn cả từ tháng và đến tháng!', 'warning');
        return;
      }
      if (fromVal > toVal) {
        window.app?.showToast('Từ tháng không thể lớn hơn đến tháng!', 'warning');
        return;
      }

      this.currentFromDate = `${fromVal}-01`;
      const [ty, tm] = toVal.split('-').map(Number);
      const lastDay = new Date(ty, tm, 0).getDate();
      this.currentToDate = `${toVal}-${String(lastDay).padStart(2, '0')}`;

      // Bỏ active nút nhanh
      document.querySelectorAll('.report-quick-btn').forEach(b => b.classList.remove('active'));

      const periodText = document.getElementById('report-period-text');
      if (periodText) {
        const [fy, fm] = fromVal.split('-');
        periodText.textContent = `${fm}/${fy} → ${String(tm).padStart(2, '0')}/${ty}`;
      }

      await this.reload();
    });

    // Toggle hiển thị theo tháng / theo ngày
    document.querySelectorAll('.report-view-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        document.querySelectorAll('.report-view-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentView = e.currentTarget.dataset.view || 'monthly';
        await this._renderRevenueChart();
      });
    });
  }

  async reload() {
    await Promise.all([
      this._loadProfitKPIs(),
      this._renderRevenueChart(),
      this._renderTopProducts(),
      this._renderCategoryChart(),
    ]);
  }

  // ── KPI Lợi nhuận từ API /reports/profit ──
  async _loadProfitKPIs() {
    try {
      const res = await window.api.request(
        `/reports/profit?from_date=${this.currentFromDate}&to_date=${this.currentToDate}`
      );
      const d = res.data || {};

      const revenue = Number(d.total_revenue || 0);
      const cogs = Number(d.total_cogs || 0);
      const profit = Number(d.gross_profit || 0);
      const margin = Number(d.profit_margin_percent || 0);

      this._setKPI('report-kpi-revenue', revenue, 'đ');
      this._setKPI('report-kpi-cogs', cogs, 'đ');
      this._setKPI('report-kpi-profit', profit, 'đ');

      const marginEl = document.getElementById('report-kpi-margin');
      if (marginEl) marginEl.textContent = `Tỷ suất lợi nhuận: ${margin.toFixed(1)}%`;

      const revMetaEl = document.getElementById('report-kpi-revenue-meta');
      if (revMetaEl) revMetaEl.textContent = `Từ ${this._fmtDate(this.currentFromDate)} đến ${this._fmtDate(this.currentToDate)}`;
      const cogsMetaEl = document.getElementById('report-kpi-cogs-meta');
      if (cogsMetaEl) cogsMetaEl.textContent = `Giá vốn xuất kho thực tế`;

      // Cập nhật số đơn & sp xuất kho nếu backend trả về
      if (d.total_orders !== undefined) {
        const ordersEl = document.getElementById('report-kpi-orders');
        if (ordersEl) ordersEl.textContent = `${d.total_orders} đơn`;
      }
      if (d.total_items_sold !== undefined) {
        const soldEl = document.getElementById('report-kpi-sold');
        if (soldEl) soldEl.textContent = `${Number(d.total_items_sold).toLocaleString('vi-VN')} sp`;
      }

      this._renderProfitSummary(revenue, cogs, profit, margin);
    } catch (e) {
      console.warn('[Reports] Lỗi tải profit KPI:', e.message);
      this._loadProfitKPIsMock();
    }
  }

  _loadProfitKPIsMock() {
    const orders = (window.MOCK_DATA?.orders || []).filter(o => o.status === 'COMPLETED');
    const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const cogs = Math.round(revenue * 0.72);
    const profit = revenue - cogs;
    const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

    this._setKPI('report-kpi-revenue', revenue, 'đ');
    this._setKPI('report-kpi-cogs', cogs, 'đ');
    this._setKPI('report-kpi-profit', profit, 'đ');
    const marginEl = document.getElementById('report-kpi-margin');
    if (marginEl) marginEl.textContent = `Tỷ suất lợi nhuận: ${margin.toFixed(1)}%`;

    const ordersEl = document.getElementById('report-kpi-orders');
    if (ordersEl) ordersEl.textContent = `${orders.length} đơn`;
    const totalSold = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0);
    const soldEl = document.getElementById('report-kpi-sold');
    if (soldEl) soldEl.textContent = `${totalSold} sp`;

    this._renderProfitSummary(revenue, cogs, profit, margin);
  }

  _renderProfitSummary(revenue, cogs, profit, margin) {
    const el = document.getElementById('report-profit-summary-body');
    if (!el) return;

    const rows = [
      { label: '💵 Tổng doanh thu', value: revenue, color: 'var(--primary)', bold: true },
      { label: '🏷️ Giá vốn hàng bán (COGS)', value: cogs, color: 'var(--warning)', bold: false },
      { label: '✨ Lợi nhuận gộp', value: profit, color: profit >= 0 ? 'var(--success)' : 'var(--error)', bold: true },
    ];

    el.innerHTML = `
      <div style="padding: 20px;">
        ${rows.map(r => `
          <div style="display: flex; justify-content: space-between; align-items: center;
                      padding: 12px 0; border-bottom: 1px solid var(--border);">
            <span style="font-size: 14px; color: var(--text-secondary);">${r.label}</span>
            <span style="font-size: ${r.bold ? '18px' : '15px'}; font-weight: ${r.bold ? '800' : '600'}; color: ${r.color};">
              ${Number(r.value).toLocaleString('vi-VN')}đ
            </span>
          </div>
        `).join('')}

        <div style="margin-top: 16px; background: ${margin >= 20 ? '#ECFDF5' : margin >= 10 ? '#FFFBEB' : '#FEF2F2'};
                    border-radius: var(--radius-md); padding: 14px; text-align: center;">
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Tỷ Suất Lợi Nhuận Gộp</div>
          <div style="font-size: 32px; font-weight: 900; color: ${margin >= 20 ? 'var(--success)' : margin >= 10 ? 'var(--warning)' : 'var(--error)'};">
            ${margin.toFixed(1)}%
          </div>
          <div style="font-size: 12px; margin-top: 4px; color: var(--text-muted);">
            ${margin >= 20 ? '✅ Tốt — Lợi nhuận cao' : margin >= 10 ? '⚠️ Trung bình — Cần cải thiện' : '❗ Thấp — Cần xem xét chi phí'}
          </div>
        </div>
      </div>
    `;
  }

  // ── Biểu đồ doanh thu từ API /reports/revenue ──
  async _renderRevenueChart() {
    const canvas = document.getElementById('report-revenue-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const subtitleEl = document.getElementById('report-chart-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = `Doanh thu & Giá vốn (${this.currentView === 'monthly' ? 'Theo từng tháng' : 'Theo từng ngày'})`;
    }

    let rows = [];
    try {
      const res = await window.api.request(
        `/reports/revenue?from_date=${this.currentFromDate}&to_date=${this.currentToDate}&type=${this.currentView}`
      );
      rows = Array.isArray(res.data) ? res.data : (res.data?.revenue || []);
    } catch (e) {
      console.warn('[Reports] Lỗi tải revenue chart:', e.message);
      rows = [];
    }

    const emptyDiv = document.getElementById('report-chart-empty');

    if (!rows || rows.length === 0) {
      if (emptyDiv) emptyDiv.style.display = 'flex';
      canvas.style.display = 'none';
      if (this.revenueChartInstance) {
        this.revenueChartInstance.destroy();
        this.revenueChartInstance = null;
      }
      return;
    }

    if (emptyDiv) emptyDiv.style.display = 'none';
    canvas.style.display = 'block';

    if (this.revenueChartInstance) this.revenueChartInstance.destroy();

    // Chuẩn bị nhãn và dữ liệu
    const labels = rows.map(r => {
      if (this.currentView === 'monthly') {
        const parts = (r.period || r.date || '').split('-');
        return parts.length >= 2 ? `T${parseInt(parts[1])}/${parts[0]}` : r.period;
      } else {
        const parts = (r.date || r.period || '').split('-');
        return parts.length >= 3 ? `${parseInt(parts[2])}/${parseInt(parts[1])}` : r.date;
      }
    });

    const revenues = rows.map(r => Number(r.revenue || 0));
    const cogsData = rows.map(r => Number(r.cogs || r.total_cogs || Math.round(Number(r.revenue || 0) * 0.72)));

    // Cập nhật tổng đơn nếu có
    const totalOrders = rows.reduce((sum, r) => sum + Number(r.order_count || 0), 0);
    if (totalOrders > 0) {
      const ordersEl = document.getElementById('report-kpi-orders');
      if (ordersEl) ordersEl.textContent = `${totalOrders} đơn`;
    }

    const ctx = canvas.getContext('2d');
    this.revenueChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Doanh thu',
            data: revenues,
            backgroundColor: '#2563EB',
            borderRadius: 6,
            order: 1,
          },
          {
            label: 'Giá vốn (COGS)',
            data: cogsData,
            backgroundColor: '#CBD5E1',
            borderRadius: 6,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('vi-VN')}đ`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: '#F1F5F9' },
            ticks: {
              callback: (val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}Tr`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              },
            },
          },
        },
      },
    });
  }

  // ── Top 5 sản phẩm bán chạy từ API /reports/products/top-selling ──
  async _renderTopProducts() {
    const container = document.getElementById('report-top-products-body');
    if (!container) return;

    let products = [];
    try {
      const res = await window.api.request(
        `/reports/products/top-selling?from_date=${this.currentFromDate}&to_date=${this.currentToDate}&limit=5`
      );
      products = res.data?.products || res.data?.top_selling || (Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('[Reports] Lỗi tải top products:', e.message);
      products = [];
    }

    // Cập nhật tổng số lượng đã bán vào KPI
    const totalSold = products.reduce((sum, p) => sum + Number(p.total_sold || 0), 0);
    if (totalSold > 0) {
      const soldEl = document.getElementById('report-kpi-sold');
      if (soldEl) soldEl.textContent = `${totalSold.toLocaleString('vi-VN')} sp`;
    }

    if (!products.length) {
      container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 28px; margin-bottom: 8px;">📭</div>
        Không có dữ liệu bán hàng trong khoảng thời gian này
      </div>`;
      return;
    }

    const maxSold = Math.max(...products.map(p => Number(p.total_sold || 0)));

    container.innerHTML = `
      <table class="custom-table" style="font-size: 13px;">
        <thead>
          <tr>
            <th style="width: 36px; text-align: center;">#</th>
            <th>Sản phẩm</th>
            <th style="width: 85px; text-align: center;">Đã bán</th>
            <th style="width: 120px; text-align: right;">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          ${products.slice(0, 5).map((p, idx) => {
            const sold = Number(p.total_sold || 0);
            const barWidth = maxSold > 0 ? (sold / maxSold * 100) : 0;
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            const pName = p.name || p.product_name || 'Sản phẩm';
            return `
            <tr>
              <td style="font-size: 16px; text-align: center;">${medals[idx] || (idx + 1)}</td>
              <td>
                <div style="font-weight: 600; font-size: 13px;">${pName}</div>
                <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px;">
                  ${p.barcode ? `<span>Mã: ${p.barcode}</span>` : ''}
                  ${p.category_name ? `<span>• ${p.category_name}</span>` : ''}
                </div>
                <div style="margin-top: 4px; height: 4px; background: #E2E8F0; border-radius: 2px; overflow: hidden;">
                  <div style="height: 100%; width: ${barWidth}%; background: ${idx === 0 ? '#F59E0B' : '#2563EB'}; border-radius: 2px;"></div>
                </div>
              </td>
              <td style="text-align: center; font-weight: 700; color: var(--primary);">${sold.toLocaleString('vi-VN')}</td>
              <td style="text-align: right; font-weight: 700; font-size: 12px;">${Number(p.total_revenue || 0).toLocaleString('vi-VN')}đ</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // ── Biểu đồ tỷ trọng doanh thu theo danh mục ──
  async _renderCategoryChart() {
    const canvas = document.getElementById('report-category-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (this.categoryChartInstance) {
      this.categoryChartInstance.destroy();
      this.categoryChartInstance = null;
    }

    let catData = {};
    try {
      const res = await window.api.request(
        `/reports/products/top-selling?from_date=${this.currentFromDate}&to_date=${this.currentToDate}&limit=100`
      );
      const products = res.data?.products || res.data?.top_selling || (Array.isArray(res.data) ? res.data : []);

      for (const p of products) {
        const cat = p.category_name || 'Chưa phân loại';
        catData[cat] = (catData[cat] || 0) + Number(p.total_revenue || 0);
      }
    } catch (e) {
      console.warn('[Reports] Lỗi tải category chart:', e.message);
      catData = {};
    }

    const labels = Object.keys(catData);
    const values = Object.values(catData);
    const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

    if (!labels.length || values.every(v => v === 0)) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext('2d');
    this.categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: COLORS.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${Number(ctx.parsed).toLocaleString('vi-VN')}đ (${pct}%)`;
              },
            },
          },
        },
        cutout: '65%',
      },
    });
  }

  // ── Helpers ──
  _setKPI(id, value, suffix = '') {
    const el = document.getElementById(id);
    if (el) el.textContent = `${Number(value).toLocaleString('vi-VN')}${suffix}`;
  }

  _fmtDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}

window.reports = new ReportsManager();
