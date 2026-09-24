const mysql = require('mysql2/promise');

/**
 * Tạo MySQL connection pool
 * Pool giúp tái sử dụng kết nối thay vì tạo kết nối mới mỗi lần query
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quan_ly_tap_hoa',
  connectionLimit: 10,       // Tối đa 10 kết nối đồng thời
  charset: 'utf8mb4',        // Hỗ trợ tiếng Việt
  timezone: '+07:00',        // Múi giờ Việt Nam
  waitForConnections: true,  // Chờ khi hết connection trong pool
  queueLimit: 0,             // Không giới hạn hàng chờ
});

// Kiểm tra kết nối khi server khởi động
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    console.log(`   Database: ${process.env.DB_NAME || 'quan_ly_tap_hoa'}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release(); // Trả connection về pool
  } catch (error) {
    console.error('❌ Kết nối MySQL thất bại:', error.message);
    console.error('   Kiểm tra lại file .env và đảm bảo MySQL đang chạy!');
    process.exit(1);
  }
})();

module.exports = pool;
