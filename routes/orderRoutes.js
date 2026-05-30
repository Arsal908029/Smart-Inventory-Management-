const express = require('express');
const router = express.Router();
const { authMiddleware, managerMiddleware } = require('../middleware/authMiddleware');
const {
    getOrders,
    showCreateForm,
    createOrder,
    getOrderDetails,
    updateOrderStatus
} = require('../controllers/orderController');

router.use(authMiddleware);

router.get('/', getOrders);
router.get('/create', showCreateForm);
router.post('/', createOrder);
router.get('/:id', getOrderDetails);
router.post('/:id/status', updateOrderStatus);

module.exports = router;