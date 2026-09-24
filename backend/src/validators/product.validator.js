const Joi = require('joi');

// Tạo sản phẩm mới
const createProductSchema = Joi.object({
  product_code: Joi.string().max(50).required().messages({
    'string.empty': 'Mã sản phẩm không được để trống',
    'any.required': 'Mã sản phẩm là bắt buộc',
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
  unit: Joi.string().max(50).default('cái'),
  import_price: Joi.number().min(0).required().messages({
    'number.min': 'Giá nhập không được âm',
    'any.required': 'Giá nhập là bắt buộc',
  }),
  selling_price: Joi.number().min(0).required().messages({
    'number.min': 'Giá bán không được âm',
    'any.required': 'Giá bán là bắt buộc',
  }),
  min_stock_level: Joi.number().integer().min(0).default(5),
  shelf_position_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().optional().allow('', null),
});

// Cập nhật sản phẩm (tất cả field đều optional)
const updateProductSchema = Joi.object({
  product_code: Joi.string().max(50).optional(),
  barcode: Joi.string().max(100).optional(),
  name: Joi.string().max(200).optional(),
  category_id: Joi.number().integer().positive().optional().allow(null),
  supplier_id: Joi.number().integer().positive().optional().allow(null),
  unit: Joi.string().max(50).optional(),
  import_price: Joi.number().min(0).optional(),
  selling_price: Joi.number().min(0).optional(),
  min_stock_level: Joi.number().integer().min(0).optional(),
  shelf_position_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});

module.exports = { createProductSchema, updateProductSchema };
