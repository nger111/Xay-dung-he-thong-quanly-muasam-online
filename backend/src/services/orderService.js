/**
 * backend/src/services/orderService.js
 * Business logic cho Quản lý Đơn hàng & Bán hàng POS
 * Áp dụng Transaction & FEFO (First Expired, First Out)
 */

const pool = require('../config/database');
const { generateOrderCode } = require('../utils/generateCode');
const createError = require('../utils/createError');
const MESSAGES = require('../constants/messages');

/** Lấy danh sách hoá đơn */
const getAllOrders = async ({ from_date, to_date, user_id, status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let where = 'WHERE 1=1';

  if (from_date) { where += ' AND DATE(so.created_at) >= ?'; params.push(from_date); }
  if (to_date) { where += ' AND DATE(so.created_at) <= ?'; params.push(to_date); }
  if (user_id) { where += ' AND so.user_id = ?'; params.push(user_id); }
  if (status) { where += ' AND so.status = ?'; params.push(status); }

  const [rows] = await pool.query(`
    SELECT so.*, u.full_name AS cashier_name,
           COUNT(sod.id) AS item_count
    FROM sales_orders so
    LEFT JOIN users u ON so.user_id = u.id
    LEFT JOIN sales_order_details sod ON so.id = sod.order_id
    ${where}
    GROUP BY so.id
    ORDER BY so.created_at DESC
    LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM sales_orders so ${where}`, params
  );

  return { orders: rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) };
};

/** Chi tiết hoá đơn */
const getOrderById = async (id) => {
  const [orderRows] = await pool.query(`
    SELECT so.*, u.full_name AS cashier_name
    FROM sales_orders so LEFT JOIN users u ON so.user_id = u.id
    WHERE so.id = ?`, [id]);

  if (!orderRows[0]) {
    throw createError(MESSAGES.ORDER_NOT_FOUND, 404, 'ORDER_NOT_FOUND');
  }

  const [details] = await pool.query(`
    SELECT sod.*, p.barcode AS product_barcode, p.unit
    FROM sales_order_details sod
    LEFT JOIN products p ON sod.product_id = p.id
    WHERE sod.order_id = ?`, [id]);

  const [payment] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [id]);

  return { ...orderRows[0], items: details, payment: payment[0] || null };
};

/** Quét mã vạch sản phẩm tại POS / Mobile Scanner */
const scanBarcode = async (barcode) => {
  if (!barcode) {
    throw createError('Mã vạch không được để trống.', 400, 'BARCODE_REQUIRED');
  }

  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name,
           sp.floor_number, sp.position_number, sp.label AS shelf_label,
           sh.name AS shelf_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS main_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
    LEFT JOIN shelves sh ON sp.shelf_id = sh.id
    WHERE p.barcode = ? AND p.status = 'ACTIVE'`, [barcode]);

  if (!rows[0]) {
    throw createError(MESSAGES.BARCODE_NOT_FOUND, 404, 'PRODUCT_NOT_FOUND');
  }

  const product = rows[0];

  // Lấy các lô hàng còn tồn theo FEFO (hạn sử dụng sớm nhất xếp trước)
  const [batches] = await pool.query(`
    SELECT id, batch_code, quantity, expiry_date, DATEDIFF(expiry_date, CURDATE()) AS days_remaining
    FROM inventory_batches
    WHERE product_id = ? AND status = 'ACTIVE' AND quantity > 0
    ORDER BY expiry_date ASC, id ASC`, [product.id]);

  return {
    ...product,
    available_batches: batches,
  };
};

/**
 * Trừ tồn kho theo thuật toán FEFO (First Expired, First Out)
 * Ưu tiên xuất lô có hạn dùng gần nhất trước
 * @param {object} conn - MySQL transaction connection
 * @param {number} productId
 * @param {number} quantityNeeded
 */
const deductStockFEFO = async (conn, productId, quantityNeeded) => {
  // 1. Khóa và lấy các lô hàng còn hàng của sản phẩm, sắp xếp HSD tăng dần
  const [batches] = await conn.query(`
    SELECT id, quantity, expiry_date
    FROM inventory_batches
    WHERE product_id = ? AND status = 'ACTIVE' AND quantity > 0
    ORDER BY expiry_date ASC, id ASC
    FOR UPDATE`, [productId]);

  let remaining = quantityNeeded;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const deduct = Math.min(batch.quantity, remaining);
    const newQty = batch.quantity - deduct;
    const newStatus = newQty === 0 ? 'DEPLETED' : 'ACTIVE';

    await conn.query(
      'UPDATE inventory_batches SET quantity = ?, status = ? WHERE id = ?',
      [newQty, newStatus, batch.id]
    );

    remaining -= deduct;
  }

  // 2. Trừ tổng tồn kho trong bảng products
  await conn.query(
    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
    [quantityNeeded, productId]
  );
};

/**
 * Tạo hoá đơn bán hàng POS — TRANSACTION + FEFO
 * @param {object} orderData - { items, cash_received, payment_method, note }
 * @param {number} userId - ID thu ngân / nhân viên bán
 */
const createPosOrder = async (orderData, userId) => {
  const { items, cash_received = 0, payment_method = 'TIEN_MAT', note } = orderData;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError('Đơn hàng phải có ít nhất 1 sản phẩm.', 400, 'EMPTY_ORDER');
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ── 1. Kiểm tra tất cả sản phẩm & tồn kho với FOR UPDATE ──
    const productSnapshots = [];
    let total_amount = 0;

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw createError('Dữ liệu sản phẩm trong giỏ hàng không hợp lệ.', 400, 'INVALID_ITEM');
      }

      const [[product]] = await conn.query(
        'SELECT id, name, barcode, selling_price, stock_quantity FROM products WHERE id = ? AND status = "ACTIVE" FOR UPDATE',
        [item.product_id]
      );

      if (!product) {
        throw createError(`Sản phẩm ID ${item.product_id} không tồn tại hoặc đã ngừng kinh doanh.`, 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.stock_quantity < item.quantity) {
        throw createError(
          `"${product.name}" không đủ số lượng trong kho. Hiện có: ${product.stock_quantity}, cần: ${item.quantity}.`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      const unit_price = item.unit_price !== undefined ? parseFloat(item.unit_price) : parseFloat(product.selling_price);
      const subtotal = unit_price * item.quantity;
      total_amount += subtotal;

      productSnapshots.push({
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        unit_price,
        quantity: item.quantity,
        subtotal,
      });
    }

    // ── 2. Kiểm tra tiền khách đưa nếu thanh toán tiền mặt ──
    const received = parseFloat(cash_received);
    if (payment_method === 'TIEN_MAT' && received < total_amount) {
      throw createError(
        `Số tiền khách đưa (${received.toLocaleString()}đ) không đủ so với tổng hoá đơn (${total_amount.toLocaleString()}đ).`,
        400,
        'INSUFFICIENT_CASH'
      );
    }

    const change_amount = Math.max(0, received - total_amount);

    // ── 3. Tạo mã hoá đơn ──
    const order_code = await generateOrderCode(conn);

    // ── 4. Lưu hoá đơn (sales_orders) ──
    const [insertResult] = await conn.query(`
      INSERT INTO sales_orders (order_code, user_id, total_amount, cash_received, change_amount, payment_method, status, note)
      VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)`,
      [order_code, userId, total_amount, received, change_amount, payment_method, note || null]
    );
    const orderId = insertResult.insertId;

    // ── 5. Lưu chi tiết hoá đơn & trừ kho theo FEFO ──
    for (const item of productSnapshots) {
      await conn.query(`
        INSERT INTO sales_order_details (order_id, product_id, product_name, barcode, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.barcode, item.unit_price, item.quantity, item.subtotal]
      );

      // Trừ kho FEFO
      await deductStockFEFO(conn, item.product_id, item.quantity);
    }

    // ── 6. Lưu bản ghi thanh toán ──
    await conn.query(`
      INSERT INTO payments (order_id, amount, method, status)
      VALUES (?, ?, ?, 'COMPLETED')`,
      [orderId, total_amount, payment_method]
    );

    await conn.commit();

    return getOrderById(orderId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Đặt hàng online từ Mobile (Customer)
 * Tương tự POS nhưng xử lý trạng thái linh hoạt
 */
const createOrder = async (orderData, userId) => {
  // Mobile customer order cũng dùng logic trừ tồn FEFO tương tự POS
  return createPosOrder(orderData, userId);
};

/** Huỷ hoá đơn — Hoàn lại tồn kho */
const cancelOrder = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[order]] = await conn.query('SELECT * FROM sales_orders WHERE id = ? FOR UPDATE', [id]);
    if (!order) throw createError(MESSAGES.ORDER_NOT_FOUND, 404, 'ORDER_NOT_FOUND');
    if (order.status === 'CANCELLED') throw createError(MESSAGES.ORDER_ALREADY_CANCELLED, 400, 'ORDER_ALREADY_CANCELLED');

    // Lấy chi tiết đơn để hoàn tồn
    const [details] = await conn.query('SELECT * FROM sales_order_details WHERE order_id = ?', [id]);

    for (const item of details) {
      await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.query("UPDATE sales_orders SET status = 'CANCELLED' WHERE id = ?", [id]);
    await conn.query("UPDATE payments SET status = 'REFUNDED' WHERE order_id = ?", [id]);

    await conn.commit();
    return { message: MESSAGES.ORDER_CANCELLED };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  scanBarcode,
  createPosOrder,
  createOrder,
  cancelOrder,
};
