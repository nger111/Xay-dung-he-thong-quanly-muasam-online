const inventoryService = require('../services/inventoryService');

const getAllInventory = async (req, res) => {
  const result = await inventoryService.getAllInventory(req.query);
  res.json({ success: true, message: 'OK', data: result });
};

const getProductInventory = async (req, res) => {
  const data = await inventoryService.getProductInventory(req.params.productId);
  res.json({ success: true, message: 'OK', data });
};

const getLowStock = async (req, res) => {
  const products = await inventoryService.getLowStockProducts();
  res.json({ success: true, message: 'OK', data: { products, total: products.length } });
};

const getOutOfStock = async (req, res) => {
  const products = await inventoryService.getOutOfStockProducts();
  res.json({ success: true, message: 'OK', data: { products, total: products.length } });
};

const adjustInventory = async (req, res) => {
  const { adjustment, reason } = req.body;
  if (adjustment === undefined) return res.status(400).json({ success: false, message: 'Cần cung cấp số lượng điều chỉnh.' });
  const result = await inventoryService.adjustInventory(req.params.productId, adjustment, reason, req.user.id);
  res.json({ success: true, message: 'Điều chỉnh tồn kho thành công!', data: result });
};

module.exports = { getAllInventory, getProductInventory, getLowStock, getOutOfStock, adjustInventory };
