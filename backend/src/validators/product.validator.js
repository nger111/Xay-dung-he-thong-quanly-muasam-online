/**
 * backend/src/validators/product.validator.js
 * Joi schemas để validate dữ liệu Sản phẩm
 * Hỗ trợ linh hoạt cả Web POS lẫn Mobile App
 */

const Joi = require('joi');

// Tạo sản phẩm mới
const createProductSchema = Joi.object({
  product_code: Joi.string().max(50).optional().allow('', null),
  code: Joi.string().max(50).optional().allow('', null),
  sku: Joi.string().max(100).optional().allow('', null),
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
  import_price: Joi.number().min(0).optional().allow(null),
  importPrice: Joi.number().min(0).optional().allow(null),
  cost_price: Joi.number().min(0).optional().allow(null),
  selling_price: Joi.number().min(0).optional(),
  exportPrice: Joi.number().min(0).optional(),
  price: Joi.number().min(0).optional(),
  min_stock_level: Joi.number().integer().min(0).default(5),
  minStock: Joi.number().integer().min(0).optional(),
  shelf_position_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
}).or('selling_price', 'exportPrice', 'price').messages({
  'object.missing': 'Vui lòng cung cấp giá bán (selling_price hoặc exportPrice)',
});

// Cập nhật sản phẩm (tất cả field đều optional)
const updateProductSchema = Joi.object({
  product_code: Joi.string().max(50).optional().allow('', null),
  code: Joi.string().max(50).optional().allow('', null),
  sku: Joi.string().max(100).optional(),
  barcode: Joi.string().max(100).optional(),
  name: Joi.string().max(200).optional(),
  category_id: Joi.number().integer().positive().optional().allow(null),
  supplier_id: Joi.number().integer().positive().optional().allow(null),
  brand: Joi.string().max(100).optional().allow('', null),
  unit: Joi.string().max(50).optional(),
  import_price: Joi.number().min(0).optional().allow(null),
  importPrice: Joi.number().min(0).optional().allow(null),
  cost_price: Joi.number().min(0).optional().allow(null),
  selling_price: Joi.number().min(0).optional(),
  exportPrice: Joi.number().min(0).optional(),
  price: Joi.number().min(0).optional(),
  min_stock_level: Joi.number().integer().min(0).optional(),
  minStock: Joi.number().integer().min(0).optional(),
  shelf_position_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().optional().allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK').optional(),
});

module.exports = { createProductSchema, updateProductSchema };
