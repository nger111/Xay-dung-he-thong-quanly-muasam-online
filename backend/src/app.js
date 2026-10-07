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
      title: 'Hệ Thống Quản Lý Kinh Doanh & Bán Lẻ Hàng Tiêu Dùng API',
      version: '1.0.0',
      description: `
        ## REST API Hệ Thống Bán Lẻ Hàng Tiêu Dùng Đa Nền Tảng (Web & Mobile)
        
        **Kiến trúc:**
        - Web Admin / Quản lý / Thu ngân POS & Khách hàng Mobile App (Expo)
        - Xác thực JWT Bearer Token & Phân quyền RBAC (ADMIN, MANAGER, CASHIER, CUSTOMER)
        - Quản lý tồn kho theo lô & hạn sử dụng (FEFO - First Expired, First Out)
        - Hỗ trợ quét mã vạch sản phẩm & kiểm tra tồn kho tức thì
        - Quản lý phiếu nhập hàng & thống kê doanh thu, lợi nhuận gộp
        
        **Hướng dẫn sử dụng:**
        1. Đăng nhập tại \`POST /api/v1/auth/login\` hoặc đăng ký \`POST /api/v1/auth/register\`
        2. Bấm nút **Authorize** (🔒) góc phải và dán JWT token: \`<token>\` (hoặc Bearer <token>)
        3. Kiểm tra các endpoints nghiệp vụ bên dưới.
      `,
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'V1 API Server (Khuyến nghị)',
      },
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Default API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'], // Swagger tự đọc JSDoc trong các file route
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ==================== MIDDLEWARES ====================

app.use(cors()); // Cho phép kết nối đa nền tảng từ Web & Mobile
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // HTTP logging

// Phục vụ ảnh sản phẩm tĩnh
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Phục vụ giao diện Web POS & Quản Trị Hệ Thống Bán Lẻ
app.use('/pos', express.static(path.join(__dirname, '..', '..', 'web')));
app.use('/web', express.static(path.join(__dirname, '..', '..', 'web')));

// ==================== ROUTES ====================
// Hỗ trợ cả /api/v1 và /api
app.use('/api/v1', routes);
app.use('/api', routes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hệ thống Quản lý Bán lẻ Hàng Tiêu dùng API đang hoạt động!',
    version: '1.0.0',
    endpoints: {
      v1: `http://localhost:${process.env.PORT || 3000}/api/v1`,
      docs: `http://localhost:${process.env.PORT || 3000}/api-docs`,
    },
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`,
    error: 'ROUTE_NOT_FOUND',
  });
});

// ==================== ERROR HANDLER ====================
app.use(errorMiddleware);

module.exports = app;
