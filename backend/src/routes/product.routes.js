/**
 * backend/src/routes/product.routes.js
 * Routes quản lý Sản phẩm
 * Base: /api/v1/products
 *
 * Phân quyền:
 *   GET (xem)     → Tất cả user đã đăng nhập (Staff + Customer)
 *   POST/PUT      → Admin, Manager
 *   DELETE        → Admin only
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin, requireAdminOrManager, requireAuth } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

// ── Các routes tìm kiếm cụ thể (đặt TRƯỚC /:id để tránh bị match nhầm) ──

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Tìm kiếm nhanh sản phẩm theo từ khóa (tên, mã vạch, SKU)
 *     tags: [Products]
 */
router.get('/search', authenticate, requireAuth, productController.searchProducts);

/**
 * @swagger
 * /products/barcode/{barcode}:
 *   get:
 *     summary: Tìm sản phẩm theo mã vạch (dùng cho POS và Mobile Scanner)
 *     tags: [Products]
 */
router.get('/barcode/:barcode', authenticate, requireAuth, productController.getProductByBarcode);

/**
 * @swagger
 * /products/sku/{sku}:
 *   get:
 *     summary: Tìm sản phẩm theo SKU
 *     tags: [Products]
 */
router.get('/sku/:sku', authenticate, requireAuth, productController.getProductBySku);

// ── CRUD sản phẩm ──

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Danh sách sản phẩm (filter, search, phân trang)
 *     tags: [Products]
 *   post:
 *     summary: Thêm sản phẩm mới (Admin, Manager)
 *     tags: [Products]
 */
router.get('/', authenticate, requireAuth, productController.getAllProducts);
router.post('/', authenticate, requireAdminOrManager, validate(createProductSchema), productController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Chi tiết sản phẩm
 *     tags: [Products]
 *   put:
 *     summary: Cập nhật sản phẩm (Admin, Manager)
 *     tags: [Products]
 *   delete:
 *     summary: Xóa / ẩn sản phẩm (Admin only)
 *     tags: [Products]
 */
router.get('/:id', authenticate, requireAuth, productController.getProductById);
router.put('/:id', authenticate, requireAdminOrManager, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

module.exports = router;
