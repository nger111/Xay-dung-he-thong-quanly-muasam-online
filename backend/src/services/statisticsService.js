const pool = require('../config/database');

/** Dashboard tổng quan */
const getDashboard = async () => {
  const [[todayStats]] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status='COMPLETED' THEN total_amount END), 0) AS today_revenue,
      COALESCE(COUNT(CASE WHEN DATE(created_at) = CURDATE() AND status='COMPLETED' THEN 1 END), 0) AS today_orders,
      COALESCE(SUM(CASE WHEN DATE(created_at) = DATE_SUB(CURDATE(),INTERVAL 1 DAY) AND status='COMPLETED' THEN total_amount END), 0) AS yesterday_revenue
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

/** Doanh thu theo ngày trong khoảng thời gian */
const getDailyRevenue = async (fromDate, toDate) => {
  const [rows] = await pool.query(`
    SELECT DATE(created_at) AS date,
           COUNT(*) AS order_count,
           COALESCE(SUM(total_amount), 0) AS revenue
    FROM sales_orders
    WHERE status = 'COMPLETED' AND DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC`,
    [fromDate, toDate]);
  return rows;
};

/** Doanh thu 7 ngày gần nhất */
const getWeeklyRevenue = async () => {
  const [rows] = await pool.query(`
    SELECT DATE(created_at) AS date,
           COUNT(*) AS order_count,
           COALESCE(SUM(total_amount), 0) AS revenue
    FROM sales_orders
    WHERE status = 'COMPLETED' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC`);
  return rows;
};

/** Doanh thu theo tháng trong năm */
const getMonthlyRevenue = async (year) => {
  const [rows] = await pool.query(`
    SELECT MONTH(created_at) AS month, YEAR(created_at) AS year,
           COUNT(*) AS order_count,
           COALESCE(SUM(total_amount), 0) AS revenue
    FROM sales_orders
    WHERE status = 'COMPLETED' AND YEAR(created_at) = ?
    GROUP BY MONTH(created_at)
    ORDER BY month ASC`,
    [year]);
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
           SUM(sod.quantity) AS total_sold,
           SUM(sod.subtotal) AS total_revenue
    FROM sales_order_details sod
    JOIN products p ON sod.product_id = p.id
    JOIN sales_orders so ON sod.order_id = so.id
    WHERE so.status = 'COMPLETED' ${dateFilter}
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT ?`,
    [...params, parseInt(limit)]);
  return rows;
};

module.exports = { getDashboard, getDailyRevenue, getWeeklyRevenue, getMonthlyRevenue, getTopProducts };
