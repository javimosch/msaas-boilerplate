const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

module.exports = {
  stripe,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PUBLISHABLE_KEY
};