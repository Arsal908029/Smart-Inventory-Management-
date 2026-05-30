const express = require('express');
const router = express.Router();
const { authMiddleware, managerMiddleware } = require('../middleware/authMiddleware');
const {
    getInvoices,
    viewInvoice,
    updateInvoiceStatus
} = require('../controllers/invoiceController');

router.use(authMiddleware);

router.get('/', getInvoices);
router.get('/:id', viewInvoice);
router.post('/:id/status', managerMiddleware, updateInvoiceStatus);

module.exports = router;
