const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createSupplierSchema, updateSupplierSchema } = require('../validators/supplier.validator');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Quản lý nhà cung cấp
 */

router.get('/', authenticate, supplierController.getAllSuppliers);
router.get('/:id', authenticate, supplierController.getSupplierById);
router.post('/', authenticate, requireAdmin, validate(createSupplierSchema), supplierController.createSupplier);
router.put('/:id', authenticate, requireAdmin, validate(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', authenticate, requireAdmin, supplierController.deleteSupplier);

module.exports = router;
