/**
 * backend/src/controllers/inventoryController.js
 * Controller quản lý Tồn kho
 */

const inventoryService = require('../services/inventoryService');
const { success, buildPagination } = require('../utils/response');

/** GET /api/v1/inventory — Danh sách tổng quan tồn kho */
const getAllInventory = async (req, res) => {
  const result = await inventoryService.getAllInventory(req.query);
  success(res, {
    message: 'Lấy dữ liệu tồn kho thành công',
    data: { inventory: result.inventory },
    pagination: buildPagination(result),
  });
};

/** GET /api/v1/inventory/:productId — Chi tiết tồn kho sản phẩm */
const getProductInventory = async (req, res) => {
  const data = await inventoryService.getProductInventory(parseInt(req.params.productId));
  success(res, {
    message: 'Lấy thông tin tồn kho sản phẩm thành công',
    data,
  });
};

/** GET /api/v1/inventory/low-stock — Sản phẩm sắp hết */
const getLowStock = async (req, res) => {
  const products = await inventoryService.getLowStockProducts();
  success(res, {
    message: 'Lấy danh sách sản phẩm sắp hết hàng thành công',
    data: { products, total: products.length },
  });
};

/** GET /api/v1/inventory/out-of-stock — Sản phẩm hết hàng */
const getOutOfStock = async (req, res) => {
  const products = await inventoryService.getOutOfStockProducts();
  success(res, {
    message: 'Lấy danh sách sản phẩm hết hàng thành công',
    data: { products, total: products.length },
  });
};

/** PUT /api/v1/inventory/:productId — Điều chỉnh tồn kho */
const adjustInventory = async (req, res) => {
  const { adjustment, reason } = req.body;
  if (adjustment === undefined) {
    return res.status(400).json({ success: false, message: 'Cần cung cấp số lượng điều chỉnh.' });
  }
  const result = await inventoryService.adjustInventory(
    parseInt(req.params.productId),
    adjustment,
    reason,
    req.user.id
  );
  success(res, {
    message: 'Điều chỉnh tồn kho thành công!',
    data: result,
  });
};

module.exports = {
  getAllInventory,
  getProductInventory,
  getLowStock,
  getOutOfStock,
  adjustInventory,
};
