const pool = require('../config/database');

/** Tạo mã hoá đơn tự động: HD20240901_0001 */
const generateOrderCode = async (conn) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const [[{ count }]] = await conn.query(
    'SELECT COUNT(*) AS count FROM sales_orders WHERE DATE(created_at) = CURDATE()'
  );
  return `HD${dateStr}${String(count + 1).padStart(4, '0')}`;
};

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

  if (!orderRows[0]) { const err = new Error('Không tìm thấy hoá đơn.'); err.statusCode = 404; throw err; }

  const [details] = await pool.query(`
    SELECT sod.*, p.barcode AS product_barcode
    FROM sales_order_details sod
    LEFT JOIN products p ON sod.product_id = p.id
    WHERE sod.order_id = ?`, [id]);

  const [payment] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [id]);

  return { ...orderRows[0], items: details, payment: payment[0] || null };
};

/**
 * Tạo hoá đơn bán hàng — TRANSACTION
 * Tạo hoá đơn + chi tiết + thanh toán + trừ tồn kho trong 1 transaction
 */
const createOrder = async (orderData, userId) => {
  const { items, cash_received, payment_method = 'TIEN_MAT', note } = orderData;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ── 1. Kiểm tra tất cả sản phẩm và tồn kho ──
    const productSnapshots = [];
    let total_amount = 0;

    for (const item of items) {
      // FOR UPDATE: khóa row để tránh race condition khi nhiều người bán cùng lúc
      const [[product]] = await conn.query(
        'SELECT id, name, barcode, selling_price, stock_quantity FROM products WHERE id = ? AND status = "ACTIVE" FOR UPDATE',
        [item.product_id]
      );

      if (!product) {
        throw Object.assign(new Error(`Sản phẩm ID ${item.product_id} không tồn tại.`), { statusCode: 404 });
      }
      if (product.stock_quantity < item.quantity) {
        throw Object.assign(
          new Error(`"${product.name}" không đủ số lượng. Tồn kho: ${product.stock_quantity}, cần: ${item.quantity}`),
          { statusCode: 400 }
        );
      }

      const subtotal = item.unit_price * item.quantity;
      total_amount += subtotal;
      productSnapshots.push({ ...item, product_name: product.name, barcode: product.barcode, subtotal });
    }

    // ── 2. Kiểm tra tiền khách đưa ──
    if (cash_received < total_amount) {
      throw Object.assign(
        new Error(`Tiền khách đưa (${cash_received.toLocaleString()}đ) không đủ. Tổng tiền: ${total_amount.toLocaleString()}đ`),
        { statusCode: 400 }
      );
    }

    const change_amount = cash_received - total_amount;

    // ── 3. Tạo mã hoá đơn ──
    const order_code = await generateOrderCode(conn);

    // ── 4. INSERT hoá đơn ──
    const [[insertResult]] = await conn.query(`
      INSERT INTO sales_orders (order_code, user_id, total_amount, cash_received, change_amount, payment_method, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_code, userId, total_amount, cash_received, change_amount, payment_method, note || null]
    );
    const orderId = insertResult.insertId;

    // ── 5. INSERT chi tiết hoá đơn + trừ tồn kho ──
    for (const item of productSnapshots) {
      await conn.query(`
        INSERT INTO sales_order_details (order_id, product_id, product_name, barcode, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.barcode, item.unit_price, item.quantity, item.subtotal]
      );

      // Trừ tồn kho — thao tác quan trọng nhất, phải trong transaction
      await conn.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // ── 6. INSERT thanh toán ──
    await conn.query(
      'INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, "COMPLETED")',
      [orderId, total_amount, payment_method]
    );

    // ── 7. COMMIT — lưu tất cả vào database ──
    await conn.commit();

    // Trả về hoá đơn vừa tạo
    return getOrderById(orderId);

  } catch (err) {
    // Nếu bất kỳ bước nào lỗi → ROLLBACK toàn bộ
    await conn.rollback();
    throw err;
  } finally {
    conn.release(); // Luôn trả connection về pool
  }
};

/** Huỷ hoá đơn (Admin only) — Hoàn tồn kho */
const cancelOrder = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[order]] = await conn.query('SELECT * FROM sales_orders WHERE id = ? FOR UPDATE', [id]);
    if (!order) throw Object.assign(new Error('Không tìm thấy hoá đơn.'), { statusCode: 404 });
    if (order.status === 'CANCELLED') throw Object.assign(new Error('Hoá đơn đã bị huỷ trước đó.'), { statusCode: 400 });

    // Lấy chi tiết để hoàn kho
    const [details] = await conn.query('SELECT * FROM sales_order_details WHERE order_id = ?', [id]);

    // Hoàn tồn kho cho từng sản phẩm
    for (const item of details) {
      await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.query("UPDATE sales_orders SET status = 'CANCELLED' WHERE id = ?", [id]);
    await conn.query("UPDATE payments SET status = 'REFUNDED' WHERE order_id = ?", [id]);

    await conn.commit();
    return { message: 'Huỷ hoá đơn thành công. Tồn kho đã được hoàn lại.' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { getAllOrders, getOrderById, createOrder, cancelOrder };
