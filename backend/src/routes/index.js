const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const supplierRoutes = require('./supplier.routes');
const inventoryRoutes = require('./inventory.routes');
const importRoutes = require('./import.routes');
const orderRoutes = require('./order.routes');
const statisticsRoutes = require('./statistics.routes');
const shelfRoutes = require('./shelf.routes');

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/imports', importRoutes);
router.use('/orders', orderRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/shelves', shelfRoutes);

module.exports = router;
