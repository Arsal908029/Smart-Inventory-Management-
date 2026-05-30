const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getReport } = require('../controllers/aggregationController');

router.use(authMiddleware);
router.get('/report', getReport);

module.exports = router;