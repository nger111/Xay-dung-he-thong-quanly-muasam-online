const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Quản lý sản phẩm
 */

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm nhanh
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khoá tìm kiếm (tên, barcode, mã SP)
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm tìm được
 */
router.get('/search', authenticate, productController.searchProducts);

/**
 * @swagger
 * /products/expired:
 *   get:
 *     summary: Danh sách sản phẩm đã hết hạn
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách lô hàng hết hạn
 */
router.get('/expired', authenticate, productController.getExpiredProducts);

/**
 * @swagger
 * /products/expiring-soon:
 *   get:
 *     summary: Sản phẩm sắp hết hạn
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Số ngày sắp hết hạn (mặc định 30)
 *     responses:
 *       200:
 *         description: Danh sách lô hàng sắp hết hạn
 */
router.get('/expiring-soon', authenticate, productController.getExpiringSoonProducts);

/**
 * @swagger
 * /products/barcode/{barcode}:
 *   get:
 *     summary: Tìm sản phẩm theo mã vạch (dùng sau khi quét)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã vạch sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/barcode/:barcode', authenticate, productController.getProductByBarcode);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Danh sách sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm phân trang
 */
router.get('/', authenticate, productController.getAllProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Chi tiết sản phẩm (kèm ảnh và lô hàng)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', authenticate, productController.getProductById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Thêm sản phẩm mới (Admin)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_code, barcode, name, import_price, selling_price]
 *             properties:
 *               product_code:
 *                 type: string
 *                 example: SP011
 *               barcode:
 *                 type: string
 *                 example: "8934588099999"
 *               name:
 *                 type: string
 *                 example: Nước tăng lực Sting 330ml
 *               category_id:
 *                 type: integer
 *               unit:
 *                 type: string
 *                 example: lon
 *               import_price:
 *                 type: number
 *                 example: 7000
 *               selling_price:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       409:
 *         description: Barcode hoặc mã SP đã tồn tại
 */
router.post('/', authenticate, requireAdmin, validate(createProductSchema), productController.createProduct);

router.put('/:id', authenticate, requireAdmin, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

module.exports = router;
