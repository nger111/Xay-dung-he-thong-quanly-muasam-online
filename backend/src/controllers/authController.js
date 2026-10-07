/**
 * backend/src/controllers/authController.js
 * Controller xử lý Authentication & User Management
 * Route → Controller → Service → DB
 */

const authService = require('../services/authService');
const { success } = require('../utils/response');
const MESSAGES = require('../constants/messages');

/** POST /api/v1/auth/register — Đăng ký (Mobile Customer) */
const register = async (req, res) => {
  const user = await authService.register(req.body);
  success(res, { message: MESSAGES.REGISTER_SUCCESS, data: { user }, statusCode: 201 });
};

/** POST /api/v1/auth/login — Đăng nhập (Web + Mobile) */
const login = async (req, res) => {
  const identifier = req.body.username || req.body.email;
  const data = await authService.login(identifier, req.body.password);
  success(res, { message: MESSAGES.LOGIN_SUCCESS, data });
};

/** POST /api/v1/auth/logout — Đăng xuất */
const logout = async (req, res) => {
  success(res, { message: MESSAGES.LOGOUT_SUCCESS, data: null });
};

/** GET /api/v1/auth/me — Lấy thông tin người dùng hiện tại */
const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  success(res, { data: { user } });
};

/** PUT /api/v1/auth/me — Cập nhật profile cá nhân */
const updateProfile = async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  success(res, { message: MESSAGES.USER_UPDATED, data: { user } });
};

/** POST /api/v1/auth/change-password — Đổi mật khẩu */
const changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body.old_password, req.body.new_password);
  success(res, { message: MESSAGES.CHANGE_PASSWORD_SUCCESS, data: null });
};

// ========== ADMIN: Quản lý Users ==========

/** GET /api/v1/users — Danh sách tài khoản (Admin) */
const getAllUsers = async (req, res) => {
  const result = await authService.getAllUsers(req.query);
  success(res, {
    data: { users: result.users },
    pagination: { page: result.page, limit: result.limit, total: result.total },
  });
};

/** POST /api/v1/users — Tạo tài khoản nhân viên (Admin) */
const createUser = async (req, res) => {
  const user = await authService.createUser(req.body);
  success(res, { message: MESSAGES.USER_CREATED, data: { user }, statusCode: 201 });
};

/** PATCH /api/v1/users/:id/lock — Khóa tài khoản (Admin) */
const lockUser = async (req, res) => {
  const result = await authService.setUserStatus(parseInt(req.params.id), false);
  success(res, { message: result.message, data: null });
};

/** PATCH /api/v1/users/:id/unlock — Mở khóa tài khoản (Admin) */
const unlockUser = async (req, res) => {
  const result = await authService.setUserStatus(parseInt(req.params.id), true);
  success(res, { message: result.message, data: null });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  createUser,
  lockUser,
  unlockUser,
};
