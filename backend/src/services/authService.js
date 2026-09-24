const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../config/jwt');

/** Đăng nhập */
const login = async (username, password) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? AND is_active = 1',
    [username]
  );
  const user = rows[0];

  if (!user) {
    const err = new Error('Tên đăng nhập không tồn tại hoặc tài khoản đã bị khóa.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Mật khẩu không đúng.');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({ id: user.id, username: user.username, role: user.role, full_name: user.full_name });

  return {
    token,
    user: { id: user.id, username: user.username, full_name: user.full_name, phone: user.phone, email: user.email, role: user.role },
  };
};

/** Lấy thông tin người dùng hiện tại */
const getMe = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, phone, email, role, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!rows[0]) {
    const err = new Error('Không tìm thấy người dùng.');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

/** Đổi mật khẩu */
const changePassword = async (userId, oldPassword, newPassword) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  const user = rows[0];
  if (!user) {
    const err = new Error('Không tìm thấy người dùng.');
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) {
    const err = new Error('Mật khẩu cũ không đúng.');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, userId]);
};

/** Tạo tài khoản mới (Admin only) */
const createUser = async (userData) => {
  const { username, password, full_name, phone, email, role } = userData;
  const hashed = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    'INSERT INTO users (username, password_hash, full_name, phone, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [username, hashed, full_name, phone || null, email || null, role]
  );

  const [newRows] = await pool.query(
    'SELECT id, username, full_name, phone, email, role, created_at FROM users WHERE id = ?',
    [result.insertId]
  );
  return newRows[0];
};

/** Lấy danh sách tất cả người dùng (Admin only) */
const getAllUsers = async () => {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, phone, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

module.exports = { login, getMe, changePassword, createUser, getAllUsers };
