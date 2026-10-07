/**
 * backend/src/services/statisticsService.js
 * Business logic cho Thống kê & Báo cáo doanh thu, lợi nhuận, tồn kho
 */

const pool = require('../config/database');

/** Dashboard tổng quan */
const getDashboard = async () => {
  const [[todayStats]] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status='COMPLETED' THEN total_amount END), 0) AS today_revenue,
      COALESCE(COUNT(CASE WHEN DATE(created_at) = CURDATE() AND status='COMPLETED' THEN 1 END), 0) AS today_orders,
      COALESCE(SUM(CASE WHEN DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status='COMPLETED' THEN total_amount END), 0) AS yesterday_revenue
    FROM sales_orders`);

  const [[productStats]] = await pool.query(`
    SELECT
      COUNT(*) AS total_products,
      SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock,
      SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= min_stock_level THEN 1 ELSE 0 END) AS low_stock
    FROM products WHERE status = 'ACTIVE'`);

  const [[expiryStats]] = await pool.query(`
    SELECT
      SUM(CASE WHEN expiry_date < CURDATE() THEN 1 ELSE 0 END) AS expired_batches,
      SUM(CASE WHEN expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiring_soon
    FROM inventory_batches WHERE status = 'ACTIVE' AND expiry_date IS NOT NULL`);

  return { ...todayStats, ...productStats, ...expiryStats };
};

/**
 * Báo cáo doanh thu theo ngày hoặc theo tháng
 * @param {{ from_date, to_date, type }} options
 */
const getRevenue = async ({ from_date, to_date, type = 'daily' }) => {
  const params = [];
  let dateFilter = '';

  if (from_date && to_date) {
    dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
    params.push(from_date, to_date);
  } else {
    // Mặc định 30 ngày gần nhất
    dateFilter = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
  }

  if (type === 'monthly') {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS period,
             COUNT(*) AS order_count,
             COALESCE(SUM(total_amount), 0) AS revenue
      FROM sales_orders
      WHERE status = 'COMPLETED' ${dateFilter}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY period ASC`, params);
    return rows;
  }

  // Mặc định daily
  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
           COUNT(*) AS order_count,
           COALESCE(SUM(total_amount), 0) AS revenue
    FROM sales_orders
    WHERE status = 'COMPLETED' ${dateFilter}
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY date ASC`, params);
  return rows;
};

/** Sản phẩm bán chạy nhất */
const getTopProducts = async (fromDate, toDate, limit = 10) => {
  const params = [];
  let dateFilter = '';
  if (fromDate && toDate) {
    dateFilter = 'AND DATE(so.created_at) BETWEEN ? AND ?';
    params.push(fromDate, toDate);
  }

  const [rows] = await pool.query(`
    SELECT p.id, p.name, p.barcode, p.unit, p.selling_price,
           COALESCE(c.name, 'Chưa phân loại') AS category_name,
           SUM(sod.quantity) AS total_sold,
           SUM(sod.subtotal) AS total_revenue
    FROM sales_order_details sod
    JOIN products p ON sod.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    JOIN sales_orders so ON sod.order_id = so.id
    WHERE so.status = 'COMPLETED' ${dateFilter}
    GROUP BY p.id, c.name
    ORDER BY total_sold DESC
    LIMIT ?`,
    [...params, parseInt(limit)]);
  return rows;
};

/** Báo cáo tồn kho & cảnh báo */
const getInventoryReport = async () => {
  const [[summary]] = await pool.query(`
    SELECT
      COUNT(*) AS total_items,
      SUM(stock_quantity) AS total_quantity,
      SUM(stock_quantity * import_price) AS total_inventory_value,
      SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
      SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= min_stock_level THEN 1 ELSE 0 END) AS low_stock_count
    FROM products WHERE status = 'ACTIVE'`);

  const [expiringBatches] = await pool.query(`
    SELECT ib.id, p.name AS product_name, p.barcode, ib.quantity, ib.expiry_date,
           DATEDIFF(ib.expiry_date, CURDATE()) AS days_remaining
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    WHERE ib.status = 'ACTIVE' AND ib.quantity > 0
      AND ib.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    ORDER BY ib.expiry_date ASC LIMIT 20`);

  return {
    summary,
    expiring_soon_batches: expiringBatches,
  };
};

/**
 * Báo cáo lợi nhuận gộp (Doanh thu - Giá vốn hàng bán COGS)
 * @param {string} fromDate
 * @param {string} toDate
 */
const getProfitReport = async (fromDate, toDate) => {
  const params = [];
  let dateFilter = '';
  if (fromDate && toDate) {
    dateFilter = 'AND DATE(so.created_at) BETWEEN ? AND ?';
    params.push(fromDate, toDate);
  } else {
    dateFilter = 'AND so.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
  }

  const [[metrics]] = await pool.query(`
    SELECT
      COALESCE(SUM(sod.subtotal), 0) AS total_revenue,
      COALESCE(SUM(sod.quantity * p.import_price), 0) AS total_cogs,
      COALESCE(SUM(sod.subtotal - (sod.quantity * p.import_price)), 0) AS gross_profit,
      COUNT(DISTINCT so.id) AS total_orders,
      COALESCE(SUM(sod.quantity), 0) AS total_items_sold
    FROM sales_order_details sod
    JOIN products p ON sod.product_id = p.id
    JOIN sales_orders so ON sod.order_id = so.id
    WHERE so.status = 'COMPLETED' ${dateFilter}`, params);

  const profitMargin = metrics.total_revenue > 0
    ? ((metrics.gross_profit / metrics.total_revenue) * 100).toFixed(2)
    : 0;

  return {
    total_revenue: metrics.total_revenue,
    total_cogs: metrics.total_cogs,
    gross_profit: metrics.gross_profit,
    total_orders: metrics.total_orders,
    total_items_sold: metrics.total_items_sold,
    profit_margin_percent: parseFloat(profitMargin),
  };
};

module.exports = {
  getDashboard,
  getRevenue,
  getTopProducts,
  getInventoryReport,
  getProfitReport,
};
