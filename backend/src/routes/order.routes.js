/**
 * backend/src/routes/order.routes.js
 * Routes quản lý Đơn hàng Online (từ Mobile App)
 * Base: /api/v1/orders
 *
 * Phân quyền:
 *   GET /orders     → Admin, Manager (xem toàn bộ)
 *   GET /orders/:id → Admin, Manager, hoặc Customer (chỉ đơn của mình)
 *   POST /orders    → Customer (đặt hàng online từ Mobile)
 *   PATCH /cancel   → Admin, Manager
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdminOrManager, requireAuth, requireCustomer } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createCustomerOrderSchema } = require('../validators/order.validator');

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Danh sách đơn hàng (Admin, Manager)
 *     tags: [Orders]
 *   post:
 *     summary: Đặt hàng online (Customer từ Mobile)
 *     tags: [Orders]
 */
router.get('/', authenticate, requireAdminOrManager, orderController.getAllOrders);
router.get('/my', authenticate, requireAuth, orderController.getMyOrders);
router.post('/', authenticate, requireAuth, validate(createCustomerOrderSchema), orderController.createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Chi tiết đơn hàng
 *     tags: [Orders]
 */
router.get('/:id', authenticate, requireAuth, orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng (Admin, Manager)
 *     tags: [Orders]
 */
router.patch('/:id/cancel', authenticate, requireAdminOrManager, orderController.cancelOrder);
router.patch('/:id/status', authenticate, requireAdminOrManager, orderController.updateOrderStatus);

module.exports = router;
