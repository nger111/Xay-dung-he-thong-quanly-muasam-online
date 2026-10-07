/**
 * backend/src/validators/auth.validator.js
 * Joi schemas để validate dữ liệu Auth
 */

const Joi = require('joi');
const ROLES = require('../constants/roles');

// Đăng nhập (Web Admin + Mobile)
const loginSchema = Joi.object({
  // Hỗ trợ cả field "username" và "email" (tùy client gửi)
  username: Joi.string().when('email', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }).messages({
    'string.empty': 'Tên đăng nhập không được để trống',
    'any.required': 'Vui lòng cung cấp tên đăng nhập hoặc email',
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Email không đúng định dạng',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
});

// Đăng ký tài khoản Khách hàng (Mobile)
const registerSchema = Joi.object({
  full_name: Joi.string().max(100).required().messages({
    'string.empty': 'Họ tên không được để trống',
    'any.required': 'Họ tên là bắt buộc',
  }),
  email: Joi.string().email().max(100).required().messages({
    'string.email': 'Email không đúng định dạng',
    'any.required': 'Email là bắt buộc',
  }),
  phone: Joi.string().pattern(/^[0-9]{9,11}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ (9-11 chữ số)',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu mới',
    'any.required': 'Xác nhận mật khẩu là bắt buộc',
  }),
});

// Đổi mật khẩu
const changePasswordSchema = Joi.object({
  old_password: Joi.string().required().messages({
    'string.empty': 'Mật khẩu cũ không được để trống',
    'any.required': 'Mật khẩu cũ là bắt buộc',
  }),
  new_password: Joi.string().min(6).required().messages({
    'string.empty': 'Mật khẩu mới không được để trống',
    'string.min': 'Mật khẩu mới phải có ít nhất {#limit} ký tự',
    'any.required': 'Mật khẩu mới là bắt buộc',
  }),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu mới',
    'any.required': 'Xác nhận mật khẩu là bắt buộc',
  }),
});

// Tạo tài khoản nhân viên (Admin only)
const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.empty': 'Tên đăng nhập không được để trống',
    'string.alphanum': 'Tên đăng nhập chỉ được chứa chữ cái và số',
    'string.min': 'Tên đăng nhập phải có ít nhất {#limit} ký tự',
    'any.required': 'Tên đăng nhập là bắt buộc',
  }),
  email: Joi.string().email().max(100).optional().allow('', null).messages({
    'string.email': 'Email không đúng định dạng',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
  full_name: Joi.string().max(100).required().messages({
    'string.empty': 'Họ tên không được để trống',
    'any.required': 'Họ tên là bắt buộc',
  }),
  phone: Joi.string().pattern(/^[0-9]{9,11}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ (9-11 chữ số)',
  }),
  // Admin có thể tạo ADMIN, MANAGER, CASHIER (không tạo CUSTOMER)
  role: Joi.string()
    .valid(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER)
    .required()
    .messages({
      'any.only': `Vai trò phải là một trong: ${ROLES.ADMIN}, ${ROLES.MANAGER}, ${ROLES.CASHIER}`,
      'any.required': 'Vai trò là bắt buộc',
    }),
});

// Cập nhật thông tin cá nhân
const updateProfileSchema = Joi.object({
  full_name: Joi.string().max(100).optional(),
  phone: Joi.string().pattern(/^[0-9]{9,11}$/).optional().allow('', null),
  email: Joi.string().email().max(100).optional().allow('', null),
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  createUserSchema,
  updateProfileSchema,
};
