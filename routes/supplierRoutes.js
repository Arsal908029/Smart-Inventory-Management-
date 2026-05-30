const express = require('express');
const router = express.Router();
const { authMiddleware, managerMiddleware } = require('../middleware/authMiddleware');
const supplierController = require('../controllers/supplierController');

router.use(authMiddleware);

router.get('/', supplierController.getSuppliers);
router.get('/create', supplierController.showCreateForm);
router.post('/', supplierController.createSupplier);
router.get('/:id', supplierController.getSupplierDetails);
router.get('/:id/edit', supplierController.showEditForm);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
