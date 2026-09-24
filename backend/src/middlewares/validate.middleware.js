/**
 * Factory function tạo middleware validate request body bằng Joi schema
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 * 
 * Cách dùng:
 *   router.post('/login', validate(loginSchema), authController.login)
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // Hiện TẤT CẢ lỗi, không dừng ở lỗi đầu tiên
      allowUnknown: false, // Không cho phép field lạ
      stripUnknown: true,  // Tự xóa field không có trong schema
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        errors: error.details.map((d) => d.message),
      });
    }

    req.body = value; // Gán lại dữ liệu đã được validate và làm sạch
    next();
  };
};

module.exports = { validate };
