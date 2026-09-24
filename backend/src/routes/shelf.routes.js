const express = require('express');
const router = express.Router();
const shelfController = require('../controllers/shelfController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Shelves
 *   description: Quản lý kệ hàng và vị trí
 */

router.get('/', authenticate, shelfController.getAllShelves);
router.post('/', authenticate, requireAdmin, shelfController.createShelf);
router.post('/:id/positions', authenticate, requireAdmin, shelfController.addPosition);

module.exports = router;
