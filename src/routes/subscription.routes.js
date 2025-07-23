const express = require('express');
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

const router = express.Router();

// Get available plans (public)
router.get('/plans', optionalAuth, subscriptionController.getPlans);

// All other routes require authentication
router.use(authenticateToken);

// Create subscription
router.post('/create', [
  body('priceId').notEmpty().withMessage('Price ID is required'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
  handleValidationErrors
], subscriptionController.createSubscription);

// Create Stripe Checkout session
router.post('/create-checkout-session', [
  body('priceId').notEmpty().withMessage('Price ID is required'),
  handleValidationErrors
], subscriptionController.createCheckoutSession);

// Get subscription status
router.get('/status', subscriptionController.getSubscriptionStatus);

// Cancel subscription
router.delete('/cancel', subscriptionController.cancelSubscription);

module.exports = router;