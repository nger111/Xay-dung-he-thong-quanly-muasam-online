/**
 * backend/src/controllers/productController.js
 * Controller quản lý Sản phẩm
 */

const productService = require('../services/productService');
const { success, buildPagination } = require('../utils/response');
const MESSAGES = require('../constants/messages');

/** GET /api/v1/products — Danh sách sản phẩm có filter, search, phân trang */
const getAllProducts = async (req, res) => {
  const result = await productService.getAllProducts(req.query);
  success(res, {
    message: 'Lấy danh sách sản phẩm thành công',
    data: { products: result.products },
    pagination: buildPagination(result),
  });
};

/** GET /api/v1/products/search — Tìm kiếm nhanh sản phẩm (Mobile + Web POS) */
const searchProducts = async (req, res) => {
  const keyword = req.query.q || req.query.keyword || req.query.search || '';
  const products = await productService.searchProducts(keyword);
  success(res, {
    message: 'Tìm kiếm sản phẩm thành công',
    data: { products, total: products.length },
  });
};

/** GET /api/v1/products/:id — Chi tiết sản phẩm */
const getProductById = async (req, res) => {
  const product = await productService.getProductById(parseInt(req.params.id));
  success(res, { message: 'Lấy thông tin sản phẩm thành công', data: { product } });
};

/** GET /api/v1/products/barcode/:barcode — Tìm theo mã vạch */
const getProductByBarcode = async (req, res) => {
  const product = await productService.getProductByBarcode(req.params.barcode);
  success(res, { message: 'Tìm thấy sản phẩm', data: { product } });
};

/** GET /api/v1/products/sku/:sku — Tìm theo SKU */
const getProductBySku = async (req, res) => {
  const product = await productService.getProductBySku(req.params.sku);
  success(res, { message: 'Tìm thấy sản phẩm', data: { product } });
};

/** POST /api/v1/products — Thêm sản phẩm mới */
const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.body);
  success(res, { message: MESSAGES.PRODUCT_CREATED, data: { product }, statusCode: 201 });
};

/** PUT /api/v1/products/:id — Cập nhật sản phẩm */
const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(parseInt(req.params.id), req.body);
  success(res, { message: MESSAGES.PRODUCT_UPDATED, data: { product } });
};

/** DELETE /api/v1/products/:id — Xóa / ẩn sản phẩm */
const deleteProduct = async (req, res) => {
  const result = await productService.deleteProduct(parseInt(req.params.id));
  success(res, { message: result.message, data: null });
};

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductByBarcode,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
};
