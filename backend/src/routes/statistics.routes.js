/**
 * backend/src/routes/statistics.routes.js
 * Routes cho Báo cáo & Thống kê
 * Base: /api/v1/reports
 *
 * Phân quyền: Admin và Manager
 */

const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdminOrManager } = require('../middlewares/role.middleware');

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Dashboard tổng quan — Doanh thu hôm nay, cảnh báo tồn kho, v.v.
 *     tags: [Reports]
 */
router.get('/dashboard', authenticate, requireAdminOrManager, statisticsController.getDashboard);

/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     summary: Báo cáo doanh thu theo ngày hoặc theo tháng
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-01-01"
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-12-31"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, monthly]
 *         default: daily
 */
router.get('/revenue', authenticate, requireAdminOrManager, statisticsController.getRevenue);

/**
 * @swagger
 * /reports/products/top-selling:
 *   get:
 *     summary: Top sản phẩm bán chạy
 *     tags: [Reports]
 */
router.get('/products/top-selling', authenticate, requireAdminOrManager, statisticsController.getTopSellingProducts);

/**
 * @swagger
 * /reports/inventory:
 *   get:
 *     summary: Báo cáo tồn kho — hết hàng, sắp hết, sắp hết hạn
 *     tags: [Reports]
 */
router.get('/inventory', authenticate, requireAdminOrManager, statisticsController.getInventoryReport);

/**
 * @swagger
 * /reports/profit:
 *   get:
 *     summary: Báo cáo lợi nhuận gộp (Doanh thu - Giá vốn COGS)
 *     tags: [Reports]
 */
router.get('/profit', authenticate, requireAdminOrManager, statisticsController.getProfitReport);

module.exports = router;
