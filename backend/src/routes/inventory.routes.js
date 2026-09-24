const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Quản lý tồn kho
 */

router.get('/low-stock', authenticate, inventoryController.getLowStock);
router.get('/out-of-stock', authenticate, inventoryController.getOutOfStock);
router.get('/:productId', authenticate, inventoryController.getProductInventory);
router.get('/', authenticate, inventoryController.getAllInventory);
router.put('/:productId', authenticate, requireAdmin, inventoryController.adjustInventory);

module.exports = router;
