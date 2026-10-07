/**
 * backend/src/routes/inventory.routes.js
 * Routes quản lý Tồn kho
 * Mount tại: /api/v1/inventory
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireStaff, requireAdminOrManager } = require('../middlewares/role.middleware');

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Danh sách sản phẩm sắp hết hàng
 *     tags: [Inventory]
 */
router.get('/low-stock', authenticate, requireStaff, inventoryController.getLowStock);

/**
 * @swagger
 * /inventory/out-of-stock:
 *   get:
 *     summary: Danh sách sản phẩm đã hết hàng
 *     tags: [Inventory]
 */
router.get('/out-of-stock', authenticate, requireStaff, inventoryController.getOutOfStock);

/**
 * @swagger
 * /inventory/{productId}:
 *   get:
 *     summary: Chi tiết tồn kho 1 sản phẩm kèm các lô hàng theo FEFO
 *     tags: [Inventory]
 */
router.get('/:productId', authenticate, requireStaff, inventoryController.getProductInventory);

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Tổng quan tồn kho (tìm kiếm, lọc theo kệ, trạng thái tồn)
 *     tags: [Inventory]
 */
router.get('/', authenticate, requireStaff, inventoryController.getAllInventory);

/**
 * @swagger
 * /inventory/{productId}:
 *   put:
 *     summary: Điều chỉnh số lượng tồn kho thủ công (Admin, Manager)
 *     tags: [Inventory]
 */
router.put('/:productId', authenticate, requireAdminOrManager, inventoryController.adjustInventory);

module.exports = router;
