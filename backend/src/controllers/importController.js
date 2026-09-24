const pool = require('../config/database');

/** Tạo mã phiếu nhập tự động */
const generateReceiptCode = async (conn) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [[{ count }]] = await conn.query(
    'SELECT COUNT(*) AS count FROM import_receipts WHERE DATE(created_at) = CURDATE()'
  );
  return `PN${dateStr}${String(count + 1).padStart(4, '0')}`;
};

const getAllImports = async (req, res) => {
  const { supplier_id, from_date, to_date, page = 1, limit = 20 } = req.query;
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

  res.json({ success: true, message: 'OK', data: { imports: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) } });
};

const getImportById = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT ir.*, s.name AS supplier_name, u.full_name AS created_by
    FROM import_receipts ir
    LEFT JOIN suppliers s ON ir.supplier_id = s.id
    LEFT JOIN users u ON ir.user_id = u.id
    WHERE ir.id = ?`, [req.params.id]);

  if (!rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập.' });

  const [details] = await pool.query(`
    SELECT ird.*, p.name AS product_name, p.barcode, p.unit,
           sp.label AS shelf_label, sh.name AS shelf_name
    FROM import_receipt_details ird
    JOIN products p ON ird.product_id = p.id
    LEFT JOIN shelf_positions sp ON ird.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE ird.receipt_id = ?`, [req.params.id]);

  res.json({ success: true, message: 'OK', data: { import: rows[0], items: details } });
};

const createImport = async (req, res) => {
  const { supplier_id, import_date, note, items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Phiếu nhập phải có ít nhất 1 sản phẩm.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const receipt_code = await generateReceiptCode(conn);

    // Tạo phiếu nhập
    const [[receiptResult]] = await conn.query(`
      INSERT INTO import_receipts (receipt_code, supplier_id, user_id, import_date, total_amount, note)
      VALUES (?, ?, ?, ?, 0, ?)`,
      [receipt_code, supplier_id || null, req.user.id, import_date, note || null]);
    const receiptId = receiptResult.insertId;

    let total_amount = 0;

    for (const item of items) {
      // Tạo lô hàng (batch)
      const [[batchResult]] = await conn.query(`
        INSERT INTO inventory_batches (product_id, supplier_id, shelf_position_id, quantity, original_quantity, import_price, import_date, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.product_id, supplier_id || null, item.shelf_position_id || null,
         item.quantity, item.quantity, item.import_price, import_date, item.expiry_date || null]);
      const batchId = batchResult.insertId;

      // Tạo dòng chi tiết phiếu nhập
      await conn.query(`
        INSERT INTO import_receipt_details (receipt_id, product_id, batch_id, quantity, import_price, expiry_date, shelf_position_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [receiptId, item.product_id, batchId, item.quantity, item.import_price, item.expiry_date || null, item.shelf_position_id || null]);

      // Cộng tồn kho và cập nhật giá nhập mới nhất
      await conn.query(
        'UPDATE products SET stock_quantity = stock_quantity + ?, import_price = ? WHERE id = ?',
        [item.quantity, item.import_price, item.product_id]);

      total_amount += item.quantity * item.import_price;
    }

    // Cập nhật tổng tiền phiếu nhập
    await conn.query('UPDATE import_receipts SET total_amount = ? WHERE id = ?', [total_amount, receiptId]);

    await conn.commit();
    res.status(201).json({ success: true, message: 'Nhập hàng thành công!', data: { receipt_id: receiptId, receipt_code, total_amount } });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { getAllImports, getImportById, createImport };
