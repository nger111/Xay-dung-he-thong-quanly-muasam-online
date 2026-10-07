/**
 * backend/src/utils/createError.js
 * Helper tạo Error object có statusCode để dùng trong service/repository
 */

/**
 * Tạo AppError có gắn statusCode và errorCode tùy chỉnh
 * @param {string} message - Thông báo lỗi
 * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409...)
 * @param {string} [errorCode] - Mã lỗi dạng string (PRODUCT_NOT_FOUND, SKU_DUPLICATE...)
 * @returns {Error}
 */
const createError = (message, statusCode = 500, errorCode = null) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (errorCode) err.errorCode = errorCode;
  return err;
};

module.exports = createError;
