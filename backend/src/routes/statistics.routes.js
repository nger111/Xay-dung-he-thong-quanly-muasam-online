const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Báo cáo thống kê
 */

/**
 * @swagger
 * /statistics/dashboard:
 *   get:
 *     summary: Thông tin tổng quan (doanh thu hôm nay, tồn kho, v.v.)
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Dữ liệu dashboard
 */
router.get('/dashboard', authenticate, statisticsController.getDashboard);
router.get('/revenue/daily', authenticate, statisticsController.getDailyRevenue);
router.get('/revenue/weekly', authenticate, statisticsController.getWeeklyRevenue);
router.get('/revenue/monthly', authenticate, statisticsController.getMonthlyRevenue);
router.get('/top-products', authenticate, statisticsController.getTopProducts);

module.exports = router;
