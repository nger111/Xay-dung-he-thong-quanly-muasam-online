/**
 * backend/src/services/authService.js
 * Business logic cho Authentication & User Management
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../config/jwt');
const createError = require('../utils/createError');
const MESSAGES = require('../constants/messages');
const ROLES = require('../constants/roles');

/**
 * Đăng nhập — hỗ trợ cả username và email
 * @param {string} identifier - username hoặc email
 * @param {string} password
 * @returns {{ token, user }}
 */
const login = async (identifier, password) => {
  // Tìm theo username HOẶC email
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
    [identifier, identifier]
  );
  const user = rows[0];

  if (!user) {
    throw createError(MESSAGES.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw createError(MESSAGES.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Đăng ký tài khoản Khách hàng mới (từ Mobile App)
 * @param {object} data - { full_name, email, phone, password }
 */
const register = async ({ full_name, email, phone, password }) => {
  // Kiểm tra email trùng
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing[0]) {
    throw createError(MESSAGES.EMAIL_DUPLICATE, 409, 'EMAIL_DUPLICATE');
  }

  const password_hash = await bcrypt.hash(password, 10);
  // Username tự động tạo từ phần đầu email
  const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '') + '_' + Date.now().toString().slice(-4);

  const [result] = await pool.query(
    'INSERT INTO users (username, password_hash, full_name, phone, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [username, password_hash, full_name, phone || null, email, ROLES.CUSTOMER]
  );

  const [newRows] = await pool.query(
    'SELECT id, username, full_name, phone, email, role, created_at FROM users WHERE id = ?',
    [result.insertId]
  );
  return newRows[0];
};

/**
 * Lấy thông tin người dùng hiện tại
 * @param {number} userId
 */
const getMe = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, phone, email, role, is_active, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!rows[0]) throw createError(MESSAGES.USER_NOT_FOUND, 404, 'USER_NOT_FOUND');
  return rows[0];
};

/**
 * Cập nhật profile cá nhân
 * @param {number} userId
 * @param {object} data
 */
const updateProfile = async (userId, data) => {
  const { full_name, phone, email } = data;

  if (email) {
    const [dup] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (dup[0]) throw createError(MESSAGES.EMAIL_DUPLICATE, 409, 'EMAIL_DUPLICATE');
  }

  await pool.query(
    'UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?',
    [full_name || null, phone || null, email || null, userId]
  );
  return getMe(userId);
};

/**
 * Đổi mật khẩu
 * @param {number} userId
 * @param {string} oldPassword
 * @param {string} newPassword
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  const user = rows[0];
  if (!user) throw createError(MESSAGES.USER_NOT_FOUND, 404, 'USER_NOT_FOUND');

  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) {
    throw createError('Mật khẩu cũ không đúng.', 400, 'WRONG_OLD_PASSWORD');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, userId]);
};

/**
 * Lấy danh sách tất cả người dùng (Admin only)
 * @param {{ role, is_active, page, limit }} query
 */
const getAllUsers = async ({ role, is_active, page = 1, limit = 20 } = {}) => {
  const params = [];
  let where = 'WHERE 1=1';

  if (role) { where += ' AND role = ?'; params.push(role); }
  if (is_active !== undefined && is_active !== '') {
    where += ' AND is_active = ?';
    params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const [rows] = await pool.query(
    `SELECT id, username, full_name, phone, email, role, is_active, created_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users ${where}`, params
  );
  return { users: rows, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Tạo tài khoản nhân viên (Admin only)
 * @param {object} userData
 */
const createUser = async (userData) => {
  const { username, email, password, full_name, phone, role } = userData;

  // Kiểm tra username trùng
  if (username) {
    const [ex] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (ex[0]) throw createError('Tên đăng nhập đã tồn tại.', 409, 'USERNAME_DUPLICATE');
  }
  // Kiểm tra email trùng
  if (email) {
    const [ex] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (ex[0]) throw createError(MESSAGES.EMAIL_DUPLICATE, 409, 'EMAIL_DUPLICATE');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, password_hash, full_name, phone, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [username || null, password_hash, full_name, phone || null, email || null, role]
  );
  return getMe(result.insertId);
};

/**
 * Khóa / Mở khóa tài khoản
 * @param {number} userId
 * @param {boolean} isActive
 */
const setUserStatus = async (userId, isActive) => {
  const [rows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
  if (!rows[0]) throw createError(MESSAGES.USER_NOT_FOUND, 404, 'USER_NOT_FOUND');

  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, userId]);
  return { message: isActive ? MESSAGES.USER_UNLOCKED : MESSAGES.USER_LOCKED };
};

module.exports = {
  login,
  register,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  createUser,
  setUserStatus,
};
