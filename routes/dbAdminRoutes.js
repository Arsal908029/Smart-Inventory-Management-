const express = require('express');
const router = express.Router();
const { authMiddleware, managerMiddleware } = require('../middleware/authMiddleware');
const dbAdminController = require('../controllers/dbAdminController');

// Remove managerMiddleware to allow standard users to test the demo
router.use(authMiddleware);

// Connection Status
router.get('/connection', dbAdminController.getConnectionStatus);

// Replica Set Status
router.get('/replset', dbAdminController.getReplSetStatus);

// Index Management
router.get('/indexes', dbAdminController.getIndexes);
router.post('/indexes/create', dbAdminController.createIndex);
router.post('/indexes/drop', dbAdminController.dropIndex);

// Transaction Demo
router.get('/transactions', dbAdminController.getTransactionsDemo);
router.post('/transactions/transfer', dbAdminController.transferPoints);
router.post('/transactions/concurrent', dbAdminController.concurrentTransactionTest);

// Sharding Demo
router.get('/sharding', dbAdminController.getShardingInfo);

module.exports = router;
