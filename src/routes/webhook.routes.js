const express = require('express');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', webhookController.handleStripeWebhook);

module.exports = router;