'use strict';

const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { redirectIfAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/login', redirectIfAuth, AuthController.showLogin);
router.get('/register', redirectIfAuth, AuthController.showRegister);

router.post(
  '/login',
  redirectIfAuth,
  [
    body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
    body('password').notEmpty().withMessage('Enter your password.'),
  ],
  AuthController.login
);

router.post(
  '/register',
  redirectIfAuth,
  [
    body('full_name').trim().isLength({ min: 2 }).withMessage('Enter your full name.'),
    body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  AuthController.register
);

router.post('/logout', AuthController.logout);

module.exports = router;
