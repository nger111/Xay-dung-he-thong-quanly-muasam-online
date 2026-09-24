const { verifyToken } = require('../config/jwt');

/**
 * Middleware xác thực JWT
 * Đọc token từ header: Authorization: Bearer <token>
 * Gắn thông tin user vào req.user nếu hợp lệ
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để tiếp tục.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, username, role, full_name }
    next();
  } catch (error) {
    next(error); // Chuyển lỗi JWT sang error middleware
  }
};

module.exports = { authenticate };
