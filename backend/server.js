require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Khởi động server
const server = app.listen(PORT, () => {
  console.log('🚀 Server đang chạy!');
  console.log(`   URL:      http://localhost:${PORT}`);
  console.log(`   API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`   Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

// Xử lý lỗi đồng bộ không được bắt
process.on('uncaughtException', (err) => {
  console.error('❌ uncaughtException:', err.message);
  process.exit(1);
});

// Xử lý Promise bị reject mà không có .catch()
process.on('unhandledRejection', (reason) => {
  console.error('❌ unhandledRejection:', reason);
  server.close(() => process.exit(1));
});
