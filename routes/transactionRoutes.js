const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getTransactions } = require('../controllers/transactionController');

router.use(authMiddleware);
router.get('/', getTransactions);

module.exports = router;