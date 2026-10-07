/**
 * backend/src/controllers/statisticsController.js
 * Controller cho Báo cáo & Thống kê doanh thu
 */

const statisticsService = require('../services/statisticsService');
const { success } = require('../utils/response');

/** GET /api/v1/reports/dashboard — Tổng quan dashboard */
const getDashboard = async (req, res) => {
  const data = await statisticsService.getDashboard();
  success(res, { message: 'Lấy dữ liệu dashboard thành công', data });
};

/** GET /api/v1/reports/revenue — Doanh thu theo ngày trong khoảng thời gian */
const getRevenue = async (req, res) => {
  const { from_date, to_date, type = 'daily' } = req.query;
  const data = await statisticsService.getRevenue({ from_date, to_date, type });
  success(res, { message: 'Lấy báo cáo doanh thu thành công', data });
};

/** GET /api/v1/reports/products/top-selling — Top sản phẩm bán chạy */
const getTopSellingProducts = async (req, res) => {
  const { from_date, to_date, limit = 10 } = req.query;
  const data = await statisticsService.getTopProducts(from_date, to_date, parseInt(limit));
  success(res, { message: 'Lấy top sản phẩm bán chạy thành công', data: { products: data } });
};

/** GET /api/v1/reports/inventory — Báo cáo tồn kho + cảnh báo */
const getInventoryReport = async (req, res) => {
  const data = await statisticsService.getInventoryReport();
  success(res, { message: 'Lấy báo cáo tồn kho thành công', data });
};

/** GET /api/v1/reports/profit — Báo cáo lợi nhuận gộp (Doanh thu - Giá vốn COGS) */
const getProfitReport = async (req, res) => {
  const { from_date, to_date } = req.query;
  const data = await statisticsService.getProfitReport(from_date, to_date);
  success(res, { message: 'Lấy báo cáo lợi nhuận thành công', data });
};

module.exports = {
  getDashboard,
  getRevenue,
  getTopSellingProducts,
  getInventoryReport,
  getProfitReport,
};
