const Joi = require('joi');

const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required().messages({
          'any.required': 'ID sản phẩm là bắt buộc',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'number.min': 'Số lượng phải ít nhất là 1',
          'any.required': 'Số lượng là bắt buộc',
        }),
        unit_price: Joi.number().min(0).required().messages({
          'any.required': 'Đơn giá là bắt buộc',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Hoá đơn phải có ít nhất 1 sản phẩm',
      'any.required': 'Danh sách sản phẩm là bắt buộc',
    }),
  cash_received: Joi.number().min(0).required().messages({
    'number.min': 'Tiền khách đưa không được âm',
    'any.required': 'Tiền khách đưa là bắt buộc',
  }),
  payment_method: Joi.string().valid('TIEN_MAT', 'CHUYEN_KHOAN', 'THE').default('TIEN_MAT'),
  note: Joi.string().optional().allow('', null),
});

module.exports = { createOrderSchema };
