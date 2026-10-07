/**
 * backend/src/routes/auth.routes.js
 * Routes cho Authentication & User Management
 * Base: /api/v1/auth và /api/v1/users
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin, requireAuth } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  createUserSchema,
  updateProfileSchema,
} = require('../validators/auth.validator');

// ========== PUBLIC (không cần token) ==========

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản Khách hàng (Mobile)
 *     tags: [Auth]
 *     security: []
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống (Web & Mobile)
 *     tags: [Auth]
 *     security: []
 */
router.post('/login', validate(loginSchema), authController.login);

// ========== PRIVATE (cần token) ==========

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng đang đăng nhập
 *     tags: [Auth]
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Cập nhật thông tin cá nhân
 *     tags: [Auth]
 */
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [Auth]
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

// ========== ADMIN ONLY: Quản lý tài khoản nhân viên ==========

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Danh sách tài khoản (Admin)
 *     tags: [Users]
 */
router.get('/users', authenticate, requireAdmin, authController.getAllUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo tài khoản nhân viên (Admin)
 *     tags: [Users]
 */
router.post('/users', authenticate, requireAdmin, validate(createUserSchema), authController.createUser);

/**
 * @swagger
 * /users/{id}/lock:
 *   patch:
 *     summary: Khóa tài khoản (Admin)
 *     tags: [Users]
 */
router.patch('/users/:id/lock', authenticate, requireAdmin, authController.lockUser);

/**
 * @swagger
 * /users/{id}/unlock:
 *   patch:
 *     summary: Mở khóa tài khoản (Admin)
 *     tags: [Users]
 */
router.patch('/users/:id/unlock', authenticate, requireAdmin, authController.unlockUser);

module.exports = router;
