const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

router.get('/bootstrap', AuthController.bootstrapStatus);
router.post('/register-admin', AuthController.validateRegister, AuthController.registerAdmin);
router.post('/login', AuthController.validateLogin, AuthController.login);
router.get('/profile', authenticate, AuthController.getProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;
