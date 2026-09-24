const productService = require('../services/productService');

const getAllProducts = async (req, res) => {
  const result = await productService.getAllProducts(req.query);
  res.json({ success: true, message: 'OK', data: result });
};

const getProductById = async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json({ success: true, message: 'OK', data: { product } });
};

const getProductByBarcode = async (req, res) => {
  const product = await productService.getProductByBarcode(req.params.barcode);
  res.json({ success: true, message: 'OK', data: { product } });
};

const searchProducts = async (req, res) => {
  const { q = '' } = req.query;
  if (!q.trim()) return res.json({ success: true, message: 'OK', data: { products: [] } });
  const products = await productService.searchProducts(q);
  res.json({ success: true, message: 'OK', data: { products, total: products.length } });
};

const getExpiredProducts = async (req, res) => {
  const products = await productService.getExpiredProducts();
  res.json({ success: true, message: 'OK', data: { products, total: products.length } });
};

const getExpiringSoonProducts = async (req, res) => {
  const days = req.query.days || 30;
  const products = await productService.getExpiringSoonProducts(days);
  res.json({ success: true, message: 'OK', data: { products, total: products.length, days: parseInt(days) } });
};

const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công!', data: { product } });
};

const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json({ success: true, message: 'Cập nhật sản phẩm thành công!', data: { product } });
};

const deleteProduct = async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  res.json({ success: true, message: result.message, data: null });
};

module.exports = { getAllProducts, getProductById, getProductByBarcode, searchProducts, getExpiredProducts, getExpiringSoonProducts, createProduct, updateProduct, deleteProduct };
