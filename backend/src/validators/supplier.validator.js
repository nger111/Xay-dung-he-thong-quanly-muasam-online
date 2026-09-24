const Joi = require('joi');

const createSupplierSchema = Joi.object({
  name: Joi.string().max(200).required().messages({
    'string.empty': 'Tên nhà cung cấp không được để trống',
    'any.required': 'Tên nhà cung cấp là bắt buộc',
  }),
  phone: Joi.string().pattern(/^[0-9]{9,11}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ',
  }),
  email: Joi.string().email().optional().allow('', null).messages({
    'string.email': 'Email không đúng định dạng',
  }),
  address: Joi.string().optional().allow('', null),
  contact_person: Joi.string().max(100).optional().allow('', null),
  note: Joi.string().optional().allow('', null),
});

const updateSupplierSchema = createSupplierSchema.fork(
  Object.keys(createSupplierSchema.describe().keys),
  (schema) => schema.optional()
);

module.exports = { createSupplierSchema, updateSupplierSchema };
