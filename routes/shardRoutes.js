const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { getShardStatus, testInsert } = require('../controllers/shardController');

router.use(authMiddleware);
router.get('/status', getShardStatus);
router.post('/test-insert', testInsert);

module.exports = router;
