/**
 * Middleware kiểm tra quyền Admin (Chủ quán)
 * Phải dùng SAU authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'CHU_QUAN') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ chủ quán mới có quyền thực hiện thao tác này.',
    });
  }
  next();
};

module.exports = { requireAdmin };
