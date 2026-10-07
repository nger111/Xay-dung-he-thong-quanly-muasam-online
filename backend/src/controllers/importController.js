/**
 * backend/src/controllers/importController.js
 * Controller quản lý Nhập hàng
 */

const importService = require('../services/importService');
const { success, buildPagination } = require('../utils/response');
const MESSAGES = require('../constants/messages');

/** GET /api/v1/purchase-orders — Danh sách phiếu nhập hàng */
const getAllImports = async (req, res) => {
  const result = await importService.getAllImports(req.query);
  success(res, {
    message: 'Lấy danh sách phiếu nhập thành công',
    data: { imports: result.imports },
    pagination: buildPagination(result),
  });
};

/** GET /api/v1/purchase-orders/:id — Chi tiết phiếu nhập */
const getImportById = async (req, res) => {
  const importData = await importService.getImportById(parseInt(req.params.id));
  success(res, {
    message: 'Lấy thông tin phiếu nhập thành công',
    data: { import: importData },
  });
};

/** POST /api/v1/purchase-orders — Tạo phiếu nhập hàng (Admin, Manager) */
const createImport = async (req, res) => {
  const result = await importService.createImport(req.body, req.user.id);
  success(res, {
    message: MESSAGES.PURCHASE_ORDER_CREATED,
    data: { import: result },
    statusCode: 201,
  });
};

module.exports = {
  getAllImports,
  getImportById,
  createImport,
};
