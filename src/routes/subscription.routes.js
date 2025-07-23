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

// Check subscription by price lookup key
router.get('/check-by-lookup-key/:lookupKey', subscriptionController.checkByLookupKey);

// Check subscription by metadata name
router.get('/check-by-metadata-name/:metadataName', subscriptionController.checkByMetadataName);

// Check subscription by price ID
router.get('/check-by-price-id/:priceId', subscriptionController.checkByPriceId);

module.exports = router;