/**
 * backend/src/routes/supplier.routes.js
 * Routes quản lý Nhà cung cấp
 * Mount tại: /api/v1/suppliers
 */

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin, requireAdminOrManager } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplier.validator');

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Danh sách nhà cung cấp
 *     tags: [Suppliers]
 *   post:
 *     summary: Thêm nhà cung cấp mới (Admin, Manager)
 *     tags: [Suppliers]
 */
router.get('/', authenticate, requireAdminOrManager, supplierController.getAllSuppliers);
router.post('/', authenticate, requireAdminOrManager, validate(createSupplierSchema), supplierController.createSupplier);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Chi tiết nhà cung cấp & lịch sử nhập hàng
 *     tags: [Suppliers]
 *   put:
 *     summary: Cập nhật nhà cung cấp (Admin, Manager)
 *     tags: [Suppliers]
 *   delete:
 *     summary: Xóa / ẩn nhà cung cấp (Admin only)
 *     tags: [Suppliers]
 */
router.get('/:id', authenticate, requireAdminOrManager, supplierController.getSupplierById);
router.put('/:id', authenticate, requireAdminOrManager, validate(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', authenticate, requireAdmin, supplierController.deleteSupplier);

module.exports = router;
