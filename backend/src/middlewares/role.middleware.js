/**
 * backend/src/middlewares/role.middleware.js
 * Middleware kiểm tra phân quyền theo Role (RBAC)
 * Phải dùng SAU authenticate middleware
 *
 * Hệ thống phân quyền:
 *   ADMIN    — Quản trị viên, toàn quyền
 *   MANAGER  — Nhân viên quản lý
 *   CASHIER  — Thu ngân / Nhân viên bán hàng
 *   CUSTOMER — Khách hàng (Mobile App)
 */

const ROLES = require('../constants/roles');
const MESSAGES = require('../constants/messages');

/**
 * Middleware cho phép một hoặc nhiều Role truy cập endpoint
 * @param {...string} allowedRoles - Danh sách roles được phép
 * @returns Middleware function
 *
 * @example
 * // Chỉ ADMIN
 * router.get('/users', authenticate, authorize(ROLES.ADMIN), controller.getUsers);
 *
 * @example
 * // ADMIN và MANAGER
 * router.get('/reports', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), controller.getReports);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.TOKEN_MISSING,
        error: 'TOKEN_MISSING',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.FORBIDDEN,
        error: 'FORBIDDEN',
      });
    }

    next();
  };
};

// ========== Shorthand middlewares hay dùng ==========

/** Chỉ Admin (bao gồm CHU_QUAN) */
const requireAdmin = authorize(ROLES.ADMIN, ROLES.CHU_QUAN);

/** Admin hoặc Manager (bao gồm CHU_QUAN) */
const requireAdminOrManager = authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CHU_QUAN);

/** Admin, Manager hoặc Cashier — nhân viên nội bộ (bao gồm CHU_QUAN, NHAN_VIEN) */
const requireStaff = authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.CHU_QUAN, ROLES.NHAN_VIEN);

/** Chỉ Customer (Mobile App) */
const requireCustomer = authorize(ROLES.CUSTOMER);

/** Tất cả user đã đăng nhập */
const requireAuth = authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.CUSTOMER, ROLES.CHU_QUAN, ROLES.NHAN_VIEN);

module.exports = {
  authorize,
  requireAdmin,
  requireAdminOrManager,
  requireStaff,
  requireCustomer,
  requireAuth,
};
