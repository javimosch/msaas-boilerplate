const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateEmail, validatePassword, validateName, handleValidationErrors } = require('../utils/validators');
const { body } = require('express-validator');

const router = express.Router();

// Register route
router.post('/register', [
  validateEmail(),
  validatePassword(),
  validateName('firstName'),
  validateName('lastName'),
  handleValidationErrors
], authController.register);

// Login route
router.post('/login', [
  validateEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], authController.login);

// Refresh token route
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  handleValidationErrors
], authController.refresh);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;