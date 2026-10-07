/**
 * backend/src/services/productService.js
 * Business logic quản lý Sản phẩm
 */

const pool = require('../config/database');
const createError = require('../utils/createError');
const MESSAGES = require('../constants/messages');

/** Lấy danh sách sản phẩm có filter, search, phân trang */
const getAllProducts = async ({ search = '', category_id, supplier_id, status = 'ACTIVE', page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE 1=1';

  if (status && status !== 'ALL') {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }
  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.product_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category_id) {
    whereClause += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (supplier_id) {
    whereClause += ' AND p.supplier_id = ?';
    params.push(supplier_id);
  }

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
    throw createError(MESSAGES.PRODUCT_NOT_FOUND, 404, 'PRODUCT_NOT_FOUND');
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
    throw createError(MESSAGES.BARCODE_NOT_FOUND, 404, 'PRODUCT_NOT_FOUND');
  }
  return rows[0];
};

/** Tìm sản phẩm theo SKU / Mã sản phẩm */
const getProductBySku = async (sku) => {
  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name, s.name AS supplier_name,
           sp.floor_number, sp.position_number, sp.label AS shelf_label, sh.name AS shelf_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS main_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE p.product_code = ?`, [sku]);

  if (!rows[0]) {
    throw createError('Không tìm thấy sản phẩm với SKU này.', 404, 'PRODUCT_NOT_FOUND');
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
  const productCode = data.sku || data.product_code || data.code || `SP${Date.now().toString().slice(-6)}`;
  const importPrice = data.cost_price !== undefined
    ? data.cost_price
    : (data.import_price !== undefined ? data.import_price : (data.importPrice !== undefined ? data.importPrice : 0));
  const sellingPrice = data.selling_price !== undefined
    ? data.selling_price
    : (data.exportPrice !== undefined ? data.exportPrice : (data.price !== undefined ? data.price : 0));
  const minStock = data.min_stock_level !== undefined
    ? data.min_stock_level
    : (data.minStock !== undefined ? data.minStock : 5);

  // Kiểm tra barcode trùng
  const [existBarcode] = await pool.query('SELECT id FROM products WHERE barcode = ?', [data.barcode]);
  if (existBarcode[0]) {
    throw createError(MESSAGES.BARCODE_DUPLICATE, 409, 'BARCODE_DUPLICATE');
  }

  // Kiểm tra product_code trùng
  const [existCode] = await pool.query('SELECT id FROM products WHERE product_code = ?', [productCode]);
  if (existCode[0]) {
    throw createError('Mã SKU / mã sản phẩm đã tồn tại.', 409, 'SKU_DUPLICATE');
  }

  const [result] = await pool.query(`
    INSERT INTO products (product_code, barcode, name, category_id, supplier_id, unit,
      import_price, selling_price, stock_quantity, min_stock_level, shelf_position_id, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    [productCode, data.barcode, data.name, data.category_id || null, data.supplier_id || null,
     data.unit || 'cái', importPrice, sellingPrice, minStock,
     data.shelf_position_id || null, data.description || null, data.status || 'ACTIVE']);

  return getProductById(result.insertId);
};

/** Cập nhật sản phẩm */
const updateProduct = async (id, data) => {
  const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing[0]) {
    throw createError(MESSAGES.PRODUCT_NOT_FOUND, 404, 'PRODUCT_NOT_FOUND');
  }

  // Kiểm tra barcode trùng nếu đổi barcode
  if (data.barcode && data.barcode !== existing[0].barcode) {
    const [dup] = await pool.query('SELECT id FROM products WHERE barcode = ? AND id != ?', [data.barcode, id]);
    if (dup[0]) {
      throw createError(MESSAGES.BARCODE_DUPLICATE, 409, 'BARCODE_DUPLICATE');
    }
  }

  // Hỗ trợ map sku -> product_code, cost_price -> import_price
  const productCode = data.sku || data.product_code;
  const importPrice = data.cost_price !== undefined ? data.cost_price : data.import_price;

  const fields = [];
  const values = [];

  const updateMap = {
    product_code: productCode,
    barcode: data.barcode,
    name: data.name,
    category_id: data.category_id,
    supplier_id: data.supplier_id,
    unit: data.unit,
    import_price: importPrice,
    selling_price: data.selling_price,
    min_stock_level: data.min_stock_level,
    shelf_position_id: data.shelf_position_id,
    description: data.description,
    status: data.status,
  };

  for (const [col, val] of Object.entries(updateMap)) {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val);
    }
  }

  if (fields.length > 0) {
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  }

  return getProductById(id);
};

/** Xóa hoặc ẩn sản phẩm */
const deleteProduct = async (id) => {
  const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing[0]) {
    throw createError(MESSAGES.PRODUCT_NOT_FOUND, 404, 'PRODUCT_NOT_FOUND');
  }

  // Nếu đã có trong hoá đơn hoặc phiếu nhập thì chuyển INACTIVE để bảo toàn toàn vẹn dữ liệu
  const [inOrders] = await pool.query('SELECT id FROM sales_order_details WHERE product_id = ? LIMIT 1', [id]);
  const [inImports] = await pool.query('SELECT id FROM import_receipt_details WHERE product_id = ? LIMIT 1', [id]);

  if (inOrders[0] || inImports[0]) {
    await pool.query("UPDATE products SET status = 'INACTIVE' WHERE id = ?", [id]);
    return { message: MESSAGES.PRODUCT_HIDDEN };
  }

  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return { message: MESSAGES.PRODUCT_DELETED };
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

module.exports = {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  getProductBySku,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getExpiredProducts,
  getExpiringSoonProducts,
};
