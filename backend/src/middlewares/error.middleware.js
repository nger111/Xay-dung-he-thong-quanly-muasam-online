/**
 * Middleware xử lý lỗi toàn cục
 * Express nhận biết đây là error middleware vì có đúng 4 tham số: (err, req, res, next)
 * Phải đặt cuối cùng trong app.js
 */
const errorMiddleware = (err, req, res, next) => {
  // Log lỗi ra console (ẩn stack trace trong production)
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } else {
    console.error('❌ Error:', err.message);
  }

  // ── Lỗi Joi Validation (dữ liệu không hợp lệ) ──
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.details ? err.details.map((d) => d.message) : [err.message],
    });
  }

  // ── Lỗi JWT ──
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ. Vui lòng đăng nhập lại.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
  }

  // ── Lỗi MySQL: Trùng dữ liệu UNIQUE ──
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.' });
  }

  // ── Lỗi MySQL: Vi phạm khóa ngoại ──
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({ success: false, message: 'Không thể xóa vì dữ liệu đang được sử dụng ở nơi khác.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, message: 'Dữ liệu tham chiếu không tồn tại.' });
  }

  // ── Lỗi tự throw có statusCode ──
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // ── Lỗi server không xác định ──
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Đã xảy ra lỗi server. Vui lòng thử lại sau.'
      : err.message,
  });
};

module.exports = errorMiddleware;
