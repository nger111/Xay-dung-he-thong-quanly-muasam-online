/**
 * backend/src/services/importService.js
 * Business logic cho Quản lý Nhập hàng & Lô hàng
 * Áp dụng MySQL Transaction khi tạo phiếu nhập và sinh lô hàng
 */

const pool = require('../config/database');
const { generatePurchaseOrderCode } = require('../utils/generateCode');
const createError = require('../utils/createError');
const MESSAGES = require('../constants/messages');

/** Lấy danh sách phiếu nhập hàng */
const getAllImports = async ({ supplier_id, from_date, to_date, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let where = 'WHERE 1=1';

  if (supplier_id) { where += ' AND ir.supplier_id = ?'; params.push(supplier_id); }
  if (from_date) { where += ' AND DATE(ir.import_date) >= ?'; params.push(from_date); }
  if (to_date) { where += ' AND DATE(ir.import_date) <= ?'; params.push(to_date); }

  const [rows] = await pool.query(`
    SELECT ir.*, s.name AS supplier_name, u.full_name AS created_by,
           COUNT(ird.id) AS item_count
    FROM import_receipts ir
    LEFT JOIN suppliers s ON ir.supplier_id = s.id
    LEFT JOIN users u ON ir.user_id = u.id
    LEFT JOIN import_receipt_details ird ON ir.id = ird.receipt_id
    ${where}
    GROUP BY ir.id
    ORDER BY ir.created_at DESC
    LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM import_receipts ir ${where}`, params
  );

  return {
    imports: rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

/** Chi tiết phiếu nhập hàng kèm danh sách sản phẩm & lô hàng */
const getImportById = async (id) => {
  const [rows] = await pool.query(`
    SELECT ir.*, s.name AS supplier_name, u.full_name AS created_by
    FROM import_receipts ir
    LEFT JOIN suppliers s ON ir.supplier_id = s.id
    LEFT JOIN users u ON ir.user_id = u.id
    WHERE ir.id = ?`, [id]);

  if (!rows[0]) {
    throw createError(MESSAGES.PURCHASE_ORDER_NOT_FOUND, 404, 'IMPORT_NOT_FOUND');
  }

  const [details] = await pool.query(`
    SELECT ird.*, p.name AS product_name, p.barcode, p.unit,
           sp.label AS shelf_label, sh.name AS shelf_name
    FROM import_receipt_details ird
    JOIN products p ON ird.product_id = p.id
    LEFT JOIN shelf_positions sp ON ird.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE ird.receipt_id = ?`, [id]);

  return {
    ...rows[0],
    items: details,
  };
};

/**
 * Tạo phiếu nhập hàng mới — TRANSACTION
 * Sinh mã phiếu tự động, tạo các lô hàng mới trong inventory_batches,
 * lưu chi tiết và tự động cộng dồn tồn kho sản phẩm
 */
const createImport = async (data, userId) => {
  const { supplier_id, import_date, note, items } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError('Phiếu nhập phải có ít nhất 1 sản phẩm.', 400, 'EMPTY_ITEMS');
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const receipt_code = await generatePurchaseOrderCode(conn);
    const importDate = import_date || new Date().toISOString().slice(0, 10);

    // 1. Tạo bản ghi phiếu nhập (import_receipts)
    const [receiptResult] = await conn.query(`
      INSERT INTO import_receipts (receipt_code, supplier_id, user_id, import_date, total_amount, note)
      VALUES (?, ?, ?, ?, 0, ?)`,
      [receipt_code, supplier_id || null, userId, importDate, note || null]
    );
    const receiptId = receiptResult.insertId;

    let total_amount = 0;

    // 2. Lặp qua từng item: tạo lô hàng, chi tiết phiếu và cập nhật tồn kho sản phẩm
    for (const item of items) {
      const quantity = parseInt(item.quantity);
      const importPrice = parseFloat(item.import_price);

      if (!item.product_id || quantity <= 0 || isNaN(importPrice) || importPrice < 0) {
        throw createError('Thông tin sản phẩm trong phiếu nhập không hợp lệ.', 400, 'INVALID_IMPORT_ITEM');
      }

      // Tạo lô hàng (inventory_batches)
      const [batchResult] = await conn.query(`
        INSERT INTO inventory_batches (product_id, supplier_id, shelf_position_id, batch_code, quantity, original_quantity, import_price, import_date, expiry_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [
          item.product_id,
          supplier_id || null,
          item.shelf_position_id || null,
          item.batch_code || null,
          quantity,
          quantity,
          importPrice,
          importDate,
          item.expiry_date || null,
        ]
      );
      const batchId = batchResult.insertId;

      // Tạo chi tiết phiếu nhập (import_receipt_details)
      await conn.query(`
        INSERT INTO import_receipt_details (receipt_id, product_id, batch_id, quantity, import_price, expiry_date, shelf_position_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [receiptId, item.product_id, batchId, quantity, importPrice, item.expiry_date || null, item.shelf_position_id || null]
      );

      // Cập nhật tồn kho và giá nhập mới nhất cho sản phẩm
      await conn.query(`
        UPDATE products
        SET stock_quantity = stock_quantity + ?,
            import_price = ?
        WHERE id = ?`,
        [quantity, importPrice, item.product_id]
      );

      total_amount += quantity * importPrice;
    }

    // 3. Cập nhật lại tổng tiền phiếu nhập
    await conn.query('UPDATE import_receipts SET total_amount = ? WHERE id = ?', [total_amount, receiptId]);

    await conn.commit();

    return getImportById(receiptId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllImports,
  getImportById,
  createImport,
};
