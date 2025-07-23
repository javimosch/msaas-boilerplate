const { stripe, STRIPE_WEBHOOK_SECRET } = require('../config/stripe');
const stripeService = require('../services/stripe.service');
const emailService = require('../services/email.service');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const logger = require('../utils/logger');

class WebhookController {
  async handleStripeWebhook(req, res, next) {
    try {
      const sig = req.headers['stripe-signature'];
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      logger.info(`Received Stripe webhook: ${event.type}`);
      
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
          
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing error:', error);
      next(error);
    }
  }
  
  async handleSubscriptionUpdate(subscription) {
    try {
      const db = getDB();
      
      logger.info('Handling subscription update webhook', {
        event: 'customer.subscription.updated',
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status
      });
      
      // Find user by Stripe customer ID
      const user = await db.collection('users').findOne({
        stripeCustomerId: subscription.customer
      });
      
      if (user) {
        logger.info('Found user for subscription update', {
          userId: user._id.toString(),
          stripeCustomerId: user.stripeCustomerId
        });
        
        await stripeService.saveSubscription(user._id.toString(), subscription);
        
        if (subscription.status === 'active') {
          await emailService.sendSubscriptionConfirmation(user, subscription);
        }
      } else {
        logger.warn('No user found for subscription update', {
          customerId: subscription.customer
        });
      }
    } catch (error) {
      logger.error('Error handling subscription update:', error);
    }
  }
  
  async handleSubscriptionDeleted(subscription) {
    try {
      const db = getDB();
      
      // Update user subscription status
      await db.collection('users').updateOne(
        { stripeCustomerId: subscription.customer },
        {
          $set: {
            'subscription.status': 'canceled',
            'metadata.updatedAt': new Date()
          }
        }
      );
      
      // Update subscription record
      await db.collection('subscriptions').updateOne(
        { stripeSubscriptionId: subscription.id },
        {
          $set: {
            status: 'canceled',
            'metadata.updatedAt': new Date()
          }
        }
      );
    } catch (error) {
      logger.error('Error handling subscription deletion:', error);
    }
  }
  
  async handlePaymentSucceeded(invoice) {
    try {
      const db = getDB();
      
      // Save payment record
      const payment = {
        userId: null, // Will be updated after finding user
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        description: invoice.description || 'Subscription payment',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      // Find user by customer ID
      const user = await db.collection('users').findOne({
        stripeCustomerId: invoice.customer
      });
      
      if (user) {
        payment.userId = user._id;
        await db.collection('payments').insertOne(payment);
      }
    } catch (error) {
      logger.error('Error handling payment succeeded:', error);
    }
  }
  
  async handlePaymentFailed(invoice) {
    try {
      const db = getDB();
      
      // Find user by customer ID
      const user = await db.collection('users').findOne({
        stripeCustomerId: invoice.customer
      });
      
      if (user) {
        await emailService.sendPaymentFailedEmail(user);
        
        // Save failed payment record
        const payment = {
          userId: user._id,
          stripePaymentIntentId: invoice.payment_intent,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          description: invoice.description || 'Subscription payment failed',
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        
        await db.collection('payments').insertOne(payment);
      }
    } catch (error) {
      logger.error('Error handling payment failed:', error);
    }
  }
}

module.exports = new WebhookController();