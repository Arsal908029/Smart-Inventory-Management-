const express = require('express');
const router = express.Router();
const { 
    loadLogin, loadRegister, login, register, logout 
} = require('../controllers/authController');

router.get('/login', loadLogin);
router.get('/register', loadRegister);
router.post('/login', login);
router.post('/register', register);
router.get('/logout', logout);

module.exports = router;