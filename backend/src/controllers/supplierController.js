const pool = require('../config/database');

const getAllSuppliers = async (req, res) => {
  const { search = '', is_active = '1' } = req.query;
  const params = [];
  let where = 'WHERE 1=1';
  if (is_active !== 'all') { where += ' AND is_active = ?'; params.push(parseInt(is_active)); }
  if (search) { where += ' AND (name LIKE ? OR phone LIKE ? OR contact_person LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const [rows] = await pool.query(`SELECT * FROM suppliers ${where} ORDER BY name ASC`, params);
  res.json({ success: true, message: 'OK', data: { suppliers: rows, total: rows.length } });
};

const getSupplierById = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp.' });

  // Lịch sử nhập hàng gần nhất
  const [imports] = await pool.query(`
    SELECT ir.id, ir.receipt_code, ir.import_date, ir.total_amount, u.full_name AS created_by
    FROM import_receipts ir LEFT JOIN users u ON ir.user_id = u.id
    WHERE ir.supplier_id = ? ORDER BY ir.created_at DESC LIMIT 10`, [req.params.id]);

  res.json({ success: true, message: 'OK', data: { supplier: rows[0], recent_imports: imports } });
};

const createSupplier = async (req, res) => {
  const { name, phone, email, address, contact_person, note } = req.body;
  const [result] = await pool.query(
    'INSERT INTO suppliers (name, phone, email, address, contact_person, note) VALUES (?, ?, ?, ?, ?, ?)',
    [name, phone || null, email || null, address || null, contact_person || null, note || null]);
  const [newRows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Thêm nhà cung cấp thành công!', data: { supplier: newRows[0] } });
};

const updateSupplier = async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp.' });

  const { name, phone, email, address, contact_person, note } = req.body;
  await pool.query(
    'UPDATE suppliers SET name=?, phone=?, email=?, address=?, contact_person=?, note=? WHERE id=?',
    [name || existing[0].name, phone !== undefined ? phone : existing[0].phone,
     email !== undefined ? email : existing[0].email, address !== undefined ? address : existing[0].address,
     contact_person !== undefined ? contact_person : existing[0].contact_person,
     note !== undefined ? note : existing[0].note, req.params.id]);
  const [updated] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Cập nhật nhà cung cấp thành công!', data: { supplier: updated[0] } });
};

const deleteSupplier = async (req, res) => {
  // Kiểm tra lịch sử nhập hàng
  const [hasImports] = await pool.query('SELECT id FROM import_receipts WHERE supplier_id = ? LIMIT 1', [req.params.id]);
  if (hasImports[0]) {
    await pool.query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Nhà cung cấp đã được ẩn (không xóa vì có lịch sử nhập hàng).', data: null });
  }
  const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp.' });
  res.json({ success: true, message: 'Xóa nhà cung cấp thành công!', data: null });
};

module.exports = { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
