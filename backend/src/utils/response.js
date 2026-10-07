/**
 * backend/src/utils/response.js
 * Helper tạo response JSON chuẩn cho toàn hệ thống
 *
 * Chuẩn response:
 * Success: { success: true, message, data, pagination? }
 * Error:   { success: false, message, error }
 */

/**
 * Tạo response thành công
 * @param {object} res - Express response object
 * @param {object} options
 * @param {string} options.message - Message mô tả
 * @param {*} options.data - Dữ liệu trả về
 * @param {number} [options.statusCode=200] - HTTP Status Code
 * @param {object} [options.pagination] - Thông tin phân trang
 */
const success = (res, { message = 'OK', data = null, statusCode = 200, pagination = null } = {}) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

/**
 * Tạo response lỗi
 * @param {object} res - Express response object
 * @param {object} options
 * @param {string} options.message - Message mô tả lỗi
 * @param {string} [options.error] - Error code (PRODUCT_NOT_FOUND,...)
 * @param {number} [options.statusCode=500] - HTTP Status Code
 */
const error = (res, { message = 'Lỗi hệ thống', error: errorCode = null, statusCode = 500 } = {}) => {
  const body = { success: false, message };
  if (errorCode) body.error = errorCode;
  return res.status(statusCode).json(body);
};

/**
 * Tạo object pagination chuẩn
 */
const buildPagination = ({ page, limit, total }) => ({
  page: parseInt(page),
  limit: parseInt(limit),
  total: parseInt(total),
  totalPages: Math.ceil(total / limit),
});

module.exports = { success, error, buildPagination };
