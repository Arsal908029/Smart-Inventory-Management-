const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
    getProfile, updateProfile, getSettings, updateSettings 
} = require('../controllers/userController');

router.use(authMiddleware);

router.get('/profile', getProfile);
router.post('/profile', updateProfile);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);

module.exports = router;
