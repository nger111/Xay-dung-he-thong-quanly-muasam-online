/**
 * backend/src/routes/import.routes.js
 * Routes quản lý Nhập hàng (Purchase Orders)
 * Mount tại: /api/v1/purchase-orders
 */

const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdminOrManager } = require('../middlewares/role.middleware');

/**
 * @swagger
 * /purchase-orders:
 *   get:
 *     summary: Danh sách phiếu nhập hàng (Admin, Manager)
 *     tags: [Purchase Orders]
 *   post:
 *     summary: Tạo phiếu nhập hàng và sinh các lô hàng (Admin, Manager)
 *     tags: [Purchase Orders]
 */
router.get('/', authenticate, requireAdminOrManager, importController.getAllImports);
router.post('/', authenticate, requireAdminOrManager, importController.createImport);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   get:
 *     summary: Chi tiết phiếu nhập hàng (Admin, Manager)
 *     tags: [Purchase Orders]
 */
router.get('/:id', authenticate, requireAdminOrManager, importController.getImportById);

module.exports = router;
