/**
 * backend/src/middlewares/error.middleware.js
 * Middleware xử lý lỗi tập trung — phải đặt CUỐI CÙNG trong app.js
 * Bắt tất cả lỗi được throw từ controllers/services
 */

const errorMiddleware = (err, req, res, next) => {
  // Ghi log lỗi trong môi trường development
  if (process.env.NODE_ENV !== 'production') {
    console.error('\n❌ ERROR:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack?.split('\n').slice(0, 4).join('\n'),
    });
  }

  // Xử lý lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.',
      error: 'TOKEN_INVALID',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
      error: 'TOKEN_EXPIRED',
    });
  }

  // Xử lý lỗi Joi Validation (do validate middleware throw)
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      message: err.details?.[0]?.message || 'Dữ liệu đầu vào không hợp lệ.',
      error: 'VALIDATION_ERROR',
    });
  }

  // Xử lý lỗi MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu bị trùng lặp (duplicate entry).',
      error: 'DUPLICATE_ENTRY',
    });
  }

  // Lỗi có statusCode tùy chỉnh (throw từ service)
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || null;

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi hệ thống không xác định.',
    ...(errorCode && { error: errorCode }),
  });
};

module.exports = errorMiddleware;
