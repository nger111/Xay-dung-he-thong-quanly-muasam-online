/**
 * backend/src/routes/index.js
 * Tổng hợp tất cả routes của hệ thống
 * Mount tại: /api/v1/
 *
 * Sơ đồ routes:
 *   POST   /api/v1/auth/register
 *   POST   /api/v1/auth/login
 *   POST   /api/v1/auth/logout
 *   GET    /api/v1/auth/me
 *   PUT    /api/v1/auth/me
 *   POST   /api/v1/auth/change-password
 *   GET    /api/v1/users                 (Admin)
 *   POST   /api/v1/users                 (Admin)
 *   PATCH  /api/v1/users/:id/lock        (Admin)
 *   PATCH  /api/v1/users/:id/unlock      (Admin)
 *
 *   GET    /api/v1/products
 *   GET    /api/v1/products/:id
 *   GET    /api/v1/products/barcode/:barcode
 *   GET    /api/v1/products/sku/:sku
 *   POST   /api/v1/products              (Admin, Manager)
 *   PUT    /api/v1/products/:id          (Admin, Manager)
 *   DELETE /api/v1/products/:id          (Admin)
 *
 *   GET    /api/v1/categories
 *   POST   /api/v1/categories            (Admin, Manager)
 *   PUT    /api/v1/categories/:id        (Admin, Manager)
 *   DELETE /api/v1/categories/:id        (Admin)
 *
 *   GET    /api/v1/suppliers
 *   POST   /api/v1/suppliers             (Admin, Manager)
 *   PUT    /api/v1/suppliers/:id         (Admin, Manager)
 *
 *   GET    /api/v1/purchase-orders       (Admin, Manager)
 *   POST   /api/v1/purchase-orders       (Admin, Manager)
 *   GET    /api/v1/purchase-orders/:id   (Admin, Manager)
 *   POST   /api/v1/purchase-orders/:id/confirm (Admin, Manager)
 *
 *   GET    /api/v1/inventory             (Admin, Manager, Cashier)
 *   GET    /api/v1/inventory/batches     (Admin, Manager)
 *   GET    /api/v1/inventory/low-stock   (Admin, Manager)
 *   GET    /api/v1/inventory/near-expiry (Admin, Manager)
 *
 *   POST   /api/v1/pos/scan              (Admin, Manager, Cashier)
 *   POST   /api/v1/pos/orders            (Admin, Manager, Cashier)
 *
 *   GET    /api/v1/orders                (Admin, Manager)
 *   GET    /api/v1/orders/:id
 *   POST   /api/v1/orders               (Customer — đặt hàng online)
 *   PATCH  /api/v1/orders/:id/cancel    (Admin, Manager)
 *
 *   GET    /api/v1/reports/dashboard     (Admin, Manager)
 *   GET    /api/v1/reports/revenue       (Admin, Manager)
 *   GET    /api/v1/reports/profit        (Admin, Manager)
 *   GET    /api/v1/reports/products/top-selling (Admin, Manager)
 *   GET    /api/v1/reports/inventory     (Admin, Manager)
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const supplierRoutes = require('./supplier.routes');
const inventoryRoutes = require('./inventory.routes');
const importRoutes = require('./import.routes');
const orderRoutes = require('./order.routes');
const posRoutes = require('./pos.routes');
const statisticsRoutes = require('./statistics.routes');
const shelfRoutes = require('./shelf.routes');

// Auth & Users
router.use('/auth', authRoutes);
// Users routes đã được mount bên trong auth.routes với prefix /users
// Nhưng để đúng với /api/v1/users, cần mount lại:
router.use('/', authRoutes); // Cho phép /api/v1/users/* hoạt động

// Quản lý
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);

// Kho
router.use('/inventory', inventoryRoutes);
router.use('/purchase-orders', importRoutes);
router.use('/imports', importRoutes); // Tương thích alias cho Mobile App

// Bán hàng
router.use('/pos', posRoutes);
router.use('/orders', orderRoutes);

// Báo cáo
router.use('/reports', statisticsRoutes);
router.use('/statistics', statisticsRoutes); // Tương thích alias cho Mobile App

// Kệ hàng
router.use('/shelves', shelfRoutes);

module.exports = router;
