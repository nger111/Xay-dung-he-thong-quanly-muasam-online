const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: Quản lý nhập hàng
 */

router.get('/', authenticate, importController.getAllImports);
router.get('/:id', authenticate, importController.getImportById);
router.post('/', authenticate, requireAdmin, importController.createImport);

module.exports = router;
