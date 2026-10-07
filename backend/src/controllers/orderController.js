/**
 * backend/src/controllers/orderController.js
 * Controller quản lý Đơn hàng (cả POS lẫn Online từ Mobile)
 */

const orderService = require('../services/orderService');
const { success, buildPagination } = require('../utils/response');
const MESSAGES = require('../constants/messages');

/** GET /api/v1/orders — Danh sách đơn hàng */
const getAllOrders = async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  success(res, {
    message: 'Lấy danh sách đơn hàng thành công',
    data: { orders: result.orders },
    pagination: buildPagination(result),
  });
};

/** GET /api/v1/orders/my — Danh sách đơn (khách hàng xem đơn của mình, nhân viên xem tất cả) */
const getMyOrders = async (req, res) => {
  const queryParams = { ...req.query };
  if (req.user.role === 'CUSTOMER') {
    queryParams.user_id = req.user.id;
  }
  const result = await orderService.getAllOrders(queryParams);
  success(res, {
    message: 'Lấy danh sách đơn hàng thành công',
    data: { orders: result.orders },
    pagination: buildPagination(result),
  });
};

/** GET /api/v1/orders/:id — Chi tiết đơn hàng */
const getOrderById = async (req, res) => {
  const customerId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
  const order = await orderService.getOrderById(parseInt(req.params.id), customerId);
  success(res, { message: 'Lấy thông tin đơn hàng thành công', data: { order } });
};

/** POST /api/v1/orders — Đặt hàng online (Customer từ Mobile) */
const createOrder = async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user.id);
  success(res, { message: MESSAGES.ORDER_CREATED, data: { order }, statusCode: 201 });
};

/** POST /api/v1/pos/orders — Bán hàng tại điểm bán POS (Cashier, Manager, Admin) */
const createPosOrder = async (req, res) => {
  const order = await orderService.createPosOrder(req.body, req.user.id);
  success(res, { message: 'Thanh toán thành công! Hóa đơn đã được tạo.', data: { order }, statusCode: 201 });
};

/** POST /api/v1/pos/scan — Quét mã vạch tại POS (trả thông tin sản phẩm + tồn kho) */
const scanBarcode = async (req, res) => {
  const { barcode } = req.body;
  const product = await orderService.scanBarcode(barcode);
  success(res, { message: 'Tìm thấy sản phẩm', data: { product } });
};

/** PATCH /api/v1/orders/:id/cancel — Hủy đơn hàng */
const cancelOrder = async (req, res) => {
  const result = await orderService.cancelOrder(parseInt(req.params.id));
  success(res, { message: result.message, data: null });
};

/** PATCH /api/v1/orders/:id/status — Cập nhật trạng thái đơn hàng (Admin, Manager) */
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(parseInt(req.params.id), status);
  success(res, {
    message: 'Cập nhật trạng thái đơn hàng thành công',
    data: { order },
  });
};

module.exports = {
  getAllOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  createPosOrder,
  scanBarcode,
  cancelOrder,
  updateOrderStatus,
};
