const orderService = require('../services/orderService');

const getAllOrders = async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  res.json({ success: true, message: 'OK', data: result });
};

const getOrderById = async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.json({ success: true, message: 'OK', data: { order } });
};

const createOrder = async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Tạo hoá đơn thành công!', data: { order } });
};

const cancelOrder = async (req, res) => {
  const result = await orderService.cancelOrder(req.params.id);
  res.json({ success: true, message: result.message, data: null });
};

module.exports = { getAllOrders, getOrderById, createOrder, cancelOrder };
