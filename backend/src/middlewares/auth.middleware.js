/**
 * backend/src/middlewares/auth.middleware.js
 * Middleware xác thực JWT
 * Đọc token từ header: Authorization: Bearer <token>
 * Gắn thông tin user vào req.user nếu hợp lệ
 */

const { verifyToken } = require('../config/jwt');
const MESSAGES = require('../constants/messages');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: MESSAGES.TOKEN_MISSING,
      error: 'TOKEN_MISSING',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: MESSAGES.TOKEN_MISSING,
      error: 'TOKEN_MISSING',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, role, full_name }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: MESSAGES.TOKEN_INVALID,
      error: 'TOKEN_INVALID',
    });
  }
};

module.exports = { authenticate };
