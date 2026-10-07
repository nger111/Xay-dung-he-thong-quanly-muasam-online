/**
 * backend/src/utils/generateCode.js
 * Các hàm sinh mã tự động cho đơn hàng, phiếu nhập, lô hàng
 */

/**
 * Sinh mã đơn hàng POS dạng: HD20260101_0001
 * @param {object} conn - MySQL connection (trong transaction hoặc pool)
 */
const generateOrderCode = async (conn) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [[{ count }]] = await conn.query(
    'SELECT COUNT(*) AS count FROM sales_orders WHERE DATE(created_at) = CURDATE()'
  );
  return `HD${dateStr}${String(count + 1).padStart(4, '0')}`;
};

/**
 * Sinh mã phiếu nhập hàng dạng: PN20260101_0001
 * @param {object} conn - MySQL connection (trong transaction hoặc pool)
 */
const generatePurchaseOrderCode = async (conn) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [[{ count }]] = await conn.query(
    'SELECT COUNT(*) AS count FROM import_receipts WHERE DATE(created_at) = CURDATE()'
  );
  return `PN${dateStr}${String(count + 1).padStart(4, '0')}`;
};

/**
 * Sinh mã lô hàng dạng: LOT-20260101-001
 * @param {object} conn - MySQL connection (trong transaction hoặc pool)
 */
const generateBatchCode = async (conn) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [[{ count }]] = await conn.query(
    'SELECT COUNT(*) AS count FROM inventory_batches WHERE DATE(created_at) = CURDATE()'
  );
  return `LOT-${dateStr}-${String(count + 1).padStart(3, '0')}`;
};

module.exports = { generateOrderCode, generatePurchaseOrderCode, generateBatchCode };
