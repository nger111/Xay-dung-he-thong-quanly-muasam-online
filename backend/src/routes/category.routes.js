const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin, requireAdminOrManager, requireAuth } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Quản lý danh mục sản phẩm
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Danh sách tất cả danh mục
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/', authenticate, requireAuth, categoryController.getAllCategories);
router.get('/:id', authenticate, requireAuth, categoryController.getCategoryById);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Thêm danh mục mới (Admin)
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Đồ uống
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 */
router.post('/', authenticate, requireAdminOrManager, categoryController.createCategory);
router.put('/:id', authenticate, requireAdminOrManager, categoryController.updateCategory);
router.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;
