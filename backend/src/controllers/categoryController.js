const pool = require('../config/database');

const getAllCategories = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  res.json({ success: true, message: 'OK', data: { categories: rows, total: rows.length } });
};

const getCategoryById = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
  res.json({ success: true, message: 'OK', data: { category: rows[0] } });
};

const createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc.' });
  const [result] = await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || null]);
  const [newRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Thêm danh mục thành công!', data: { category: newRows[0] } });
};

const updateCategory = async (req, res) => {
  const { name, description } = req.body;
  const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
  await pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?',
    [name || existing[0].name, description !== undefined ? description : existing[0].description, req.params.id]);
  const [updated] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Cập nhật danh mục thành công!', data: { category: updated[0] } });
};

const deleteCategory = async (req, res) => {
  const [inUse] = await pool.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [req.params.id]);
  if (inUse[0]) return res.status(400).json({ success: false, message: 'Không thể xóa: danh mục đang được dùng bởi sản phẩm.' });
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
  res.json({ success: true, message: 'Xóa danh mục thành công!', data: null });
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
