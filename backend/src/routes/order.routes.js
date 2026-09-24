const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createOrderSchema } = require('../validators/order.validator');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Quản lý bán hàng và hoá đơn
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo hoá đơn bán hàng mới
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, cash_received]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *               cash_received:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [TIEN_MAT, CHUYEN_KHOAN, THE]
 *                 default: TIEN_MAT
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo hoá đơn thành công (bao gồm tạo hoá đơn, chi tiết hoá đơn, thanh toán và trừ tồn kho bằng transaction)
 */
router.post('/', authenticate, validate(createOrderSchema), orderController.createOrder);

router.get('/', authenticate, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.delete('/:id', authenticate, requireAdmin, orderController.cancelOrder);

module.exports = router;
