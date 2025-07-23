const stripeService = require('../services/stripe.service');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class SubscriptionController {
  async getPlans(req, res, next) {
    try {
      const plans = await stripeService.getPlans();
      
      res.json({
        success: true,
        data: { plans }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createSubscription(req, res, next) {
    try {
      const { priceId, paymentMethodId } = req.body;
      
      if (!priceId || !paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: 'Price ID and payment method ID are required'
        });
      }
      
      const subscription = await stripeService.createSubscription(
        req.user._id.toString(),
        priceId,
        paymentMethodId
      );
      
      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: { subscription }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getSubscriptionStatus(req, res, next) {
    try {
      const db = getDB();
      const userId = req.user._id;
      
      console.log(`subscription.controller getSubscriptionStatus`, {
        userId,
        userSubscription: req.user.subscription
      });
      
      const subscription = await db.collection('subscriptions').findOne({
        userId: new ObjectId(userId)
      });
      
      console.log(`subscription.controller subscription lookup result`, {
        subscriptionId: subscription?._id?.toString(),
        stripeSubscriptionId: subscription?.stripeSubscriptionId,
        status: subscription?.status
      });
      
      res.json({
        success: true,
        data: {
          subscription: subscription || null,
          userSubscription: req.user.subscription
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async cancelSubscription(req, res, next) {
    try {
      const subscription = await stripeService.cancelSubscription(
        req.user._id.toString()
      );
      
      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: { subscription }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createCheckoutSession(req, res, next) {
    try {
      const { priceId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({
          success: false,
          message: 'Price ID is required'
        });
      }
      
      const session = await stripeService.createCheckoutSession(
        req.user._id.toString(),
        priceId
      );
      
      res.json({
        success: true,
        message: 'Checkout session created successfully',
        data: { session }
      });
    } catch (error) {
      next(error);
    }
  }

  async checkByLookupKey(req, res, next) {
    try {
      const { lookupKey } = req.params;
      const db = getDB();
      
      const subscription = await db.collection('subscriptions').findOne({
        userId: new ObjectId(req.user._id),
        'items.price.lookup_key': lookupKey,
        status: { $in: ['active', 'trialing'] }
      });
      
      const isSubscribed = !!subscription;
      const isTrial = subscription?.status === 'trialing' &&
                     subscription?.trial_end &&
                     subscription.trial_end > Math.floor(Date.now() / 1000);
      
      res.json({
        success: true,
        data: {
          subscribed: isSubscribed,
          trial: isTrial
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async checkByMetadataName(req, res, next) {
    try {
      const { metadataName } = req.params;
      const db = getDB();
      
      const subscription = await db.collection('subscriptions').findOne({
        userId: new ObjectId(req.user._id),
        'items.price.product.metadata.name': metadataName,
        status: { $in: ['active', 'trialing'] }
      });
      
      const isSubscribed = !!subscription;
      const isTrial = subscription?.status === 'trialing' &&
                     subscription?.trial_end &&
                     subscription.trial_end > Math.floor(Date.now() / 1000);
      
      res.json({
        success: true,
        data: {
          subscribed: isSubscribed,
          trial: isTrial
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async checkByPriceId(req, res, next) {
    try {
      const { priceId } = req.params;
      const db = getDB();
      
      const subscription = await db.collection('subscriptions').findOne({
        userId: new ObjectId(req.user._id),
        'items.price.id': priceId,
        status: { $in: ['active', 'trialing'] }
      });
      
      const isSubscribed = !!subscription;
      const isTrial = subscription?.status === 'trialing' &&
                     subscription?.trial_end &&
                     subscription.trial_end > Math.floor(Date.now() / 1000);
      
      res.json({
        success: true,
        data: {
          subscribed: isSubscribed,
          trial: isTrial
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionController();