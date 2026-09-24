const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Tạo JWT token từ payload
 * @param {Object} payload - { id, username, role, full_name }
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Xác thực và giải mã JWT token
 * @param {string} token
 * @returns {Object} Payload đã giải mã
 * @throws JsonWebTokenError | TokenExpiredError
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, generateToken, verifyToken };
