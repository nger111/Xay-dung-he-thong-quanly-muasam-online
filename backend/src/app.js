require('express-async-errors'); // Phải require TRƯỚC express để tự động bắt lỗi async

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const routes = require('./routes/index');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// ==================== SWAGGER CONFIG ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Quản lý Tạp Hoá',
      version: '1.0.0',
      description: `
        ## Hệ thống API Quản lý & Bán hàng Tạp Hoá
        
        **Hướng dẫn sử dụng:**
        1. Đăng nhập tại \`POST /api/auth/login\` để lấy JWT token
        2. Click nút **Authorize** (🔒) và nhập token theo dạng: \`Bearer <token>\`
        3. Thực hiện các API khác
        
        **Tài khoản mặc định:**
        - Chủ quán: \`admin\` / \`Admin@123\`
        - Nhân viên: \`nhanvien1\` / \`Admin@123\`
      `,
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token (không cần thêm "Bearer")',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'], // Swagger tự đọc JSDoc trong các file route
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ==================== MIDDLEWARES ====================

app.use(cors()); // Cho phép tất cả origin (có thể giới hạn trong production)
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // HTTP logging

// Phục vụ ảnh sản phẩm đã upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================== ROUTES ====================
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Quản lý Tạp Hoá đang hoạt động!',
    docs: `http://localhost:${process.env.PORT || 3000}/api-docs`,
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy: ${req.method} ${req.originalUrl}`,
  });
});

// ==================== ERROR HANDLER (phải đặt cuối cùng) ====================
app.use(errorMiddleware);

module.exports = app;
