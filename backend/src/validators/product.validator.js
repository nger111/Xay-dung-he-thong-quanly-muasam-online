/**
 * backend/src/validators/product.validator.js
 * Joi schemas để validate dữ liệu Sản phẩm
 */

const Joi = require('joi');

// Tạo sản phẩm mới
const createProductSchema = Joi.object({
  product_code: Joi.string().max(50).optional().allow('', null)
    .messages({ 'string.max': 'Mã sản phẩm không được vượt quá 50 ký tự' }),
  sku: Joi.string().max(100).required().messages({
    'string.empty': 'SKU không được để trống',
    'any.required': 'SKU là bắt buộc',
  }),
  barcode: Joi.string().max(100).required().messages({
    'string.empty': 'Mã vạch không được để trống',
    'any.required': 'Mã vạch là bắt buộc',
  }),
  name: Joi.string().max(200).required().messages({
    'string.empty': 'Tên sản phẩm không được để trống',
    'any.required': 'Tên sản phẩm là bắt buộc',
  }),
  category_id: Joi.number().integer().positive().optional().allow(null),
  supplier_id: Joi.number().integer().positive().optional().allow(null),
  brand: Joi.string().max(100).optional().allow('', null),
  unit: Joi.string().max(50).default('cái'),
  cost_price: Joi.number().min(0).optional().allow(null)
    .messages({ 'number.min': 'Giá nhập tham khảo không được âm' }),
  selling_price: Joi.number().min(0).required().messages({
    'number.min': 'Giá bán không được âm',
    'any.required': 'Giá bán là bắt buộc',
  }),
  min_stock_level: Joi.number().integer().min(0).default(5),
  description: Joi.string().optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

// Cập nhật sản phẩm (tất cả field đều optional)
const updateProductSchema = Joi.object({
  product_code: Joi.string().max(50).optional().allow('', null),
  sku: Joi.string().max(100).optional(),
  barcode: Joi.string().max(100).optional(),
  name: Joi.string().max(200).optional(),
  category_id: Joi.number().integer().positive().optional().allow(null),
  supplier_id: Joi.number().integer().positive().optional().allow(null),
  brand: Joi.string().max(100).optional().allow('', null),
  unit: Joi.string().max(50).optional(),
  cost_price: Joi.number().min(0).optional().allow(null),
  selling_price: Joi.number().min(0).optional(),
  min_stock_level: Joi.number().integer().min(0).optional(),
  description: Joi.string().optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK').optional(),
});

module.exports = { createProductSchema, updateProductSchema };
