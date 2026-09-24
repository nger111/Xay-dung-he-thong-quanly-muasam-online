const pool = require('../config/database');

/** Lấy danh sách sản phẩm có filter, search, phân trang */
const getAllProducts = async ({ search = '', category_id, supplier_id, status = 'ACTIVE', page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (status) { whereClause += ' AND p.status = ?'; params.push(status); }
  if (search) { whereClause += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.product_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (category_id) { whereClause += ' AND p.category_id = ?'; params.push(category_id); }
  if (supplier_id) { whereClause += ' AND p.supplier_id = ?'; params.push(supplier_id); }

  const sql = `
    SELECT p.*,
           c.name AS category_name,
           s.name AS supplier_name,
           sp.floor_number, sp.position_number, sp.label AS shelf_label,
           sh.name AS shelf_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS main_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [products] = await pool.query(sql, [...params, parseInt(limit), offset]);
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${whereClause}`,
    params
  );

  return { products, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) };
};

/** Lấy chi tiết sản phẩm theo ID (kèm ảnh và batch) */
const getProductById = async (id) => {
  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name, s.name AS supplier_name,
           sp.floor_number, sp.position_number, sp.label AS shelf_label, sh.name AS shelf_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE p.id = ?`, [id]);

  if (!rows[0]) {
    const err = new Error('Không tìm thấy sản phẩm.'); err.statusCode = 404; throw err;
  }

  const product = rows[0];
  const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC', [id]);
  const [batches] = await pool.query(`
    SELECT ib.*, sp.label AS shelf_label, sh.name AS shelf_name,
           DATEDIFF(ib.expiry_date, CURDATE()) AS days_remaining
    FROM inventory_batches ib
    LEFT JOIN shelf_positions sp ON ib.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE ib.product_id = ? AND ib.status = 'ACTIVE'
    ORDER BY ib.expiry_date ASC`, [id]);

  return { ...product, images, batches };
};

/** Tìm sản phẩm theo barcode */
const getProductByBarcode = async (barcode) => {
  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name, s.name AS supplier_name,
           sp.floor_number, sp.position_number, sp.label AS shelf_label, sh.name AS shelf_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS main_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE p.barcode = ?`, [barcode]);

  if (!rows[0]) {
    const err = new Error('Không tìm thấy sản phẩm với mã vạch này.'); err.statusCode = 404; throw err;
  }
  return rows[0];
};

/** Tìm kiếm nhanh sản phẩm */
const searchProducts = async (keyword) => {
  const [rows] = await pool.query(`
    SELECT p.id, p.product_code, p.barcode, p.name, p.unit, p.selling_price, p.stock_quantity,
           c.name AS category_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS main_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'ACTIVE' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.product_code LIKE ?)
    ORDER BY p.name ASC LIMIT 50`,
    [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
  return rows;
};

/** Thêm sản phẩm mới */
const createProduct = async (data) => {
  // Kiểm tra barcode trùng
  const [existBarcode] = await pool.query('SELECT id FROM products WHERE barcode = ?', [data.barcode]);
  if (existBarcode[0]) {
    const err = new Error(`Mã vạch "${data.barcode}" đã tồn tại.`); err.statusCode = 409; throw err;
  }
  // Kiểm tra product_code trùng
  const [existCode] = await pool.query('SELECT id FROM products WHERE product_code = ?', [data.product_code]);
  if (existCode[0]) {
    const err = new Error(`Mã sản phẩm "${data.product_code}" đã tồn tại.`); err.statusCode = 409; throw err;
  }

  const [result] = await pool.query(`
    INSERT INTO products (product_code, barcode, name, category_id, supplier_id, unit,
      import_price, selling_price, stock_quantity, min_stock_level, shelf_position_id, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [data.product_code, data.barcode, data.name, data.category_id || null, data.supplier_id || null,
     data.unit || 'cái', data.import_price, data.selling_price, data.min_stock_level || 5,
     data.shelf_position_id || null, data.description || null]);

  return getProductById(result.insertId);
};

/** Cập nhật sản phẩm */
const updateProduct = async (id, data) => {
  const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing[0]) { const err = new Error('Không tìm thấy sản phẩm.'); err.statusCode = 404; throw err; }

  // Kiểm tra barcode trùng (nếu có thay đổi)
  if (data.barcode && data.barcode !== existing[0].barcode) {
    const [dup] = await pool.query('SELECT id FROM products WHERE barcode = ? AND id != ?', [data.barcode, id]);
    if (dup[0]) { const err = new Error('Mã vạch đã được dùng bởi sản phẩm khác.'); err.statusCode = 409; throw err; }
  }

  const fields = [];
  const values = [];
  const allowed = ['product_code', 'barcode', 'name', 'category_id', 'supplier_id', 'unit',
    'import_price', 'selling_price', 'min_stock_level', 'shelf_position_id', 'description', 'status'];

  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
  }

  if (fields.length === 0) { return getProductById(id); }

  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  return getProductById(id);
};

/** Xóa hoặc ẩn sản phẩm */
const deleteProduct = async (id) => {
  const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing[0]) { const err = new Error('Không tìm thấy sản phẩm.'); err.statusCode = 404; throw err; }

  // Nếu đã có trong hoá đơn thì chỉ ẩn, không xóa thật
  const [inOrders] = await pool.query('SELECT id FROM sales_order_details WHERE product_id = ? LIMIT 1', [id]);
  if (inOrders[0]) {
    await pool.query("UPDATE products SET status = 'INACTIVE' WHERE id = ?", [id]);
    return { message: 'Sản phẩm đã được ẩn (không thể xóa vì đã có trong hoá đơn bán hàng).' };
  }

  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return { message: 'Xóa sản phẩm thành công.' };
};

/** Sản phẩm đã hết hạn */
const getExpiredProducts = async () => {
  const [rows] = await pool.query(`
    SELECT ib.id AS batch_id, p.id AS product_id, p.name AS product_name, p.barcode, p.unit,
           ib.quantity, ib.expiry_date, DATEDIFF(ib.expiry_date, CURDATE()) AS days_remaining,
           sp.label AS shelf_label, sh.name AS shelf_name
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    LEFT JOIN shelf_positions sp ON ib.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE ib.expiry_date < CURDATE() AND ib.status = 'ACTIVE' AND ib.quantity > 0
    ORDER BY ib.expiry_date ASC`);
  return rows;
};

/** Sản phẩm sắp hết hạn */
const getExpiringSoonProducts = async (days = 30) => {
  const [rows] = await pool.query(`
    SELECT ib.id AS batch_id, p.id AS product_id, p.name AS product_name, p.barcode, p.unit,
           ib.quantity, ib.expiry_date, DATEDIFF(ib.expiry_date, CURDATE()) AS days_remaining,
           sp.label AS shelf_label, sh.name AS shelf_name
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    LEFT JOIN shelf_positions sp ON ib.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE ib.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND ib.status = 'ACTIVE' AND ib.quantity > 0
    ORDER BY ib.expiry_date ASC`, [parseInt(days)]);
  return rows;
};

module.exports = { getAllProducts, getProductById, getProductByBarcode, searchProducts, createProduct, updateProduct, deleteProduct, getExpiredProducts, getExpiringSoonProducts };
