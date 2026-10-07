const pool = require('../config/database');

/** Lấy tổng quan tồn kho */
const getAllInventory = async ({ search = '', shelf_id, stock_status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let where = "WHERE p.status = 'ACTIVE'";

  if (search) { where += ' AND (p.name LIKE ? OR p.barcode LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (shelf_id) { where += ' AND sh.id = ?'; params.push(shelf_id); }
  if (stock_status === 'HET_HANG') { where += ' AND p.stock_quantity = 0'; }
  else if (stock_status === 'SAP_HET') { where += ' AND p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level'; }
  else if (stock_status === 'CON_HANG') { where += ' AND p.stock_quantity > p.min_stock_level'; }

  const sql = `
    SELECT p.id, p.product_code, p.barcode, p.name, p.unit, p.selling_price,
           p.stock_quantity, p.min_stock_level,
           CASE WHEN p.stock_quantity = 0 THEN 'HET_HANG'
                WHEN p.stock_quantity <= p.min_stock_level THEN 'SAP_HET'
                ELSE 'CON_HANG' END AS stock_status,
           c.name AS category_name,
           sp.floor_number, sp.position_number, sp.label AS shelf_label,
           sh.name AS shelf_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS main_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    ${where}
    ORDER BY p.stock_quantity ASC
    LIMIT ? OFFSET ?`;

  const [rows] = await pool.query(sql, [...params, parseInt(limit), offset]);
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id LEFT JOIN shelves sh ON sp.shelf_id = sh.id ${where}`,
    params
  );

  return { inventory: rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) };
};

/** Chi tiết tồn kho 1 sản phẩm (kèm các lô hàng) */
const getProductInventory = async (productId) => {
  const [pRows] = await pool.query(
    `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
    [productId]
  );
  if (!pRows[0]) { const err = new Error('Không tìm thấy sản phẩm.'); err.statusCode = 404; throw err; }

  const [batches] = await pool.query(`
    SELECT ib.*, sp.label AS shelf_label, sh.name AS shelf_name,
           DATEDIFF(ib.expiry_date, CURDATE()) AS days_remaining
    FROM inventory_batches ib
    LEFT JOIN shelf_positions sp ON ib.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE ib.product_id = ? ORDER BY ib.expiry_date ASC`, [productId]);

  return { ...pRows[0], batches };
};

/** Sản phẩm sắp hết hàng */
const getLowStockProducts = async () => {
  const [rows] = await pool.query(`
    SELECT p.id, p.barcode, p.name, p.unit, p.stock_quantity, p.min_stock_level,
           sp.label AS shelf_label, sh.name AS shelf_name
    FROM products p
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE p.status = 'ACTIVE' AND p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level
    ORDER BY p.stock_quantity ASC`);
  return rows;
};

/** Sản phẩm hết hàng */
const getOutOfStockProducts = async () => {
  const [rows] = await pool.query(`
    SELECT p.id, p.barcode, p.name, p.unit, p.stock_quantity,
           sp.label AS shelf_label, sh.name AS shelf_name
    FROM products p
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE p.status = 'ACTIVE' AND p.stock_quantity = 0
    ORDER BY p.name ASC`);
  return rows;
};

/** Điều chỉnh tồn kho thủ công */
const adjustInventory = async (productId, adjustment, reason, userId) => {
  const [pRows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
  if (!pRows[0]) { const err = new Error('Không tìm thấy sản phẩm.'); err.statusCode = 404; throw err; }

  const newQty = pRows[0].stock_quantity + parseInt(adjustment);
  if (newQty < 0) {
    const err = new Error(`Không thể điều chỉnh: tồn kho sẽ âm (${newQty}). Hiện tại: ${pRows[0].stock_quantity}`);
    err.statusCode = 400; throw err;
  }

  await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, productId]);
  return { product_id: productId, old_quantity: pRows[0].stock_quantity, adjustment, new_quantity: newQty, reason };
};

/** Danh sách tất cả lô hàng (inventory_batches) với đầy đủ liên kết sản phẩm, nhà cung cấp, kệ hàng */
const getAllBatches = async ({ search = '', status = 'ALL', product_id, supplier_id } = {}) => {
  const params = [];
  let where = 'WHERE 1=1';

  if (search) {
    where += ` AND (
      ib.batch_code LIKE ? OR 
      p.name LIKE ? OR 
      p.barcode LIKE ? OR 
      p.product_code LIKE ? OR 
      s.name LIKE ?
    )`;
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  if (product_id) {
    where += ' AND ib.product_id = ?';
    params.push(parseInt(product_id));
  }

  if (supplier_id) {
    where += ' AND ib.supplier_id = ?';
    params.push(parseInt(supplier_id));
  }

  if (status === 'ACTIVE') {
    where += " AND ib.status = 'ACTIVE' AND (ib.expiry_date IS NULL OR ib.expiry_date >= CURDATE())";
  } else if (status === 'DEPLETED') {
    where += " AND (ib.status = 'DEPLETED' OR ib.quantity <= 0)";
  } else if (status === 'EXPIRED') {
    where += " AND (ib.status = 'EXPIRED' OR (ib.expiry_date IS NOT NULL AND ib.expiry_date < CURDATE()))";
  } else if (status === 'NEAR_EXPIRY') {
    where += " AND ib.status = 'ACTIVE' AND ib.expiry_date IS NOT NULL AND DATEDIFF(ib.expiry_date, CURDATE()) <= 30 AND ib.expiry_date >= CURDATE()";
  }

  const sql = `
    SELECT 
      ib.id,
      ib.product_id,
      ib.supplier_id,
      ib.shelf_position_id,
      COALESCE(ib.batch_code, CONCAT('LO-', p.product_code, '-', LPAD(ib.id, 4, '0'))) AS batch_code,
      ib.quantity,
      ib.original_quantity,
      ib.import_price,
      DATE_FORMAT(ib.import_date, '%Y-%m-%d') AS import_date,
      DATE_FORMAT(ib.expiry_date, '%Y-%m-%d') AS expiry_date,
      ib.status,
      ib.created_at,
      ib.updated_at,
      p.name AS product_name,
      p.product_code,
      p.barcode,
      p.unit,
      p.selling_price,
      c.name AS category_name,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      sh.name AS shelf_name,
      sp.floor_number,
      sp.position_number,
      sp.label AS shelf_label,
      DATEDIFF(ib.expiry_date, CURDATE()) AS days_remaining,
      CASE
        WHEN ib.status = 'DEPLETED' OR ib.quantity <= 0 THEN 'DEPLETED'
        WHEN ib.expiry_date IS NOT NULL AND ib.expiry_date < CURDATE() THEN 'EXPIRED'
        WHEN ib.expiry_date IS NOT NULL AND DATEDIFF(ib.expiry_date, CURDATE()) <= 30 THEN 'NEAR_EXPIRY'
        ELSE 'ACTIVE'
      END AS fefo_status
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON ib.supplier_id = s.id
    LEFT JOIN shelf_positions sp ON ib.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    ${where}
    ORDER BY ib.expiry_date ASC, ib.id DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
};

module.exports = { getAllInventory, getProductInventory, getLowStockProducts, getOutOfStockProducts, adjustInventory, getAllBatches };
