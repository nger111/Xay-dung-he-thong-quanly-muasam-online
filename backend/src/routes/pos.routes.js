/**
 * backend/src/routes/pos.routes.js
 * Routes cho Bán hàng tại điểm bán POS (Point of Sale)
 * Base: /api/v1/pos
 *
 * Phân quyền: Admin, Manager, Cashier (nhân viên nội bộ)
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireStaff } = require('../middlewares/role.middleware');

/**
 * @swagger
 * /pos/scan:
 *   post:
 *     summary: Quét mã vạch sản phẩm tại POS — trả về thông tin sản phẩm + tồn kho hiện tại
 *     tags: [POS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [barcode]
 *             properties:
 *               barcode:
 *                 type: string
 *                 example: "8934588012345"
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm và tồn kho
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.post('/scan', authenticate, requireStaff, orderController.scanBarcode);

/**
 * @swagger
 * /pos/orders:
 *   post:
 *     summary: Tạo hóa đơn bán hàng POS
 *     description: |
 *       Tạo hóa đơn bán hàng tại quầy.
 *       Hệ thống tự động:
 *       - Kiểm tra tồn kho
 *       - Xuất theo FEFO (hết hạn gần nhất trước)
 *       - Trừ tồn từng lô hàng
 *       - Ghi stock_transaction
 *       - Tạo payment record
 *       Tất cả trong 1 MySQL Transaction
 *     tags: [POS]
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
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *               cash_received:
 *                 type: number
 *                 description: Số tiền khách đưa
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, TRANSFER, CARD]
 *                 default: CASH
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thanh toán thành công, trả về hóa đơn
 *       400:
 *         description: Không đủ tồn kho hoặc tiền không đủ
 */
router.post('/orders', authenticate, requireStaff, orderController.createPosOrder);

module.exports = router;
