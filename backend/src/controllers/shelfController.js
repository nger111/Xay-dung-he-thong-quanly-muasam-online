const pool = require('../config/database');

const getAllShelves = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT shelves.*,
           COALESCE(
             (
               SELECT JSON_ARRAYAGG(JSON_OBJECT('id', sp.id, 'floor', sp.floor_number, 'position', sp.position_number, 'label', sp.label))
               FROM shelf_positions sp
               WHERE sp.shelf_id = shelves.id
             ),
             '[]'
           ) AS positions
    FROM shelves
  `);
  
  // Chuyển string JSON thành array object cho MySQL 5.7+ 
  const formattedRows = rows.map(row => {
    try {
      row.positions = typeof row.positions === 'string' ? JSON.parse(row.positions) : row.positions;
    } catch (e) {
      row.positions = [];
    }
    return row;
  });

  res.json({ success: true, message: 'OK', data: { shelves: formattedRows, total: formattedRows.length } });
};

const createShelf = async (req, res) => {
  const { name, description } = req.body;
  const [result] = await pool.query('INSERT INTO shelves (name, description) VALUES (?, ?)', [name, description || null]);
  const [newRows] = await pool.query('SELECT * FROM shelves WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Thêm kệ hàng thành công', data: { shelf: newRows[0] } });
};

const addPosition = async (req, res) => {
  const { floor_number, position_number, label } = req.body;
  const [result] = await pool.query(
    'INSERT INTO shelf_positions (shelf_id, floor_number, position_number, label) VALUES (?, ?, ?, ?)',
    [req.params.id, floor_number, position_number, label]
  );
  res.status(201).json({ success: true, message: 'Thêm vị trí trên kệ thành công', data: { id: result.insertId } });
};

module.exports = { getAllShelves, createShelf, addPosition };
