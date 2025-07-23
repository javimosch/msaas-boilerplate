const { stripe } = require('../config/stripe');
const { getDB } = require('../config/database');
const logger = require('../utils/logger');

class ReconciliationService {
  async verifySubscriptionStatuses() {
    try {
      logger.info('Starting subscription status reconciliation');
      
      // Get active subscriptions from Stripe
      const stripeSubscriptions = await this.getActiveStripeSubscriptions();
      
      // Get active subscriptions from database
      const dbSubscriptions = await this.getActiveDatabaseSubscriptions();
      
      // Compare and update any mismatches
      await this.reconcileSubscriptions(stripeSubscriptions, dbSubscriptions);
      
      logger.info('Subscription reconciliation completed successfully');
    } catch (error) {
      logger.error('Subscription reconciliation failed:', error);
    }
  }
  
  async getActiveStripeSubscriptions() {
    const subscriptions = [];
    let startingAfter = null;
    let hasMore = true;
    
    while (hasMore) {
      const params = {
        status: 'active',
        limit: 100
      };
      
      // Only include starting_after when we have a value
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const response = await stripe.subscriptions.list(params);
      subscriptions.push(...response.data);
      
      hasMore = response.has_more;
      if (hasMore && response.data.length > 0) startingAfter = response.data[response.data.length - 1].id;
    }
    
    return subscriptions;
  }
  
  async getActiveDatabaseSubscriptions() {
    const db = getDB();
    return await db.collection('subscriptions').find({
      status: 'active'
    }).toArray();
  }
  
  async reconcileSubscriptions(stripeSubs, dbSubs) {
    const db = getDB();
    
    // Create map of Stripe subscriptions by ID
    const stripeSubMap = new Map();
    stripeSubs.forEach(sub => stripeSubMap.set(sub.id, sub));
    
    // Check database subscriptions against Stripe
    for (const dbSub of dbSubs) {
      const stripeSub = stripeSubMap.get(dbSub.stripeSubscriptionId);
      
      if (!stripeSub) {
        // Subscription not found in Stripe - mark as canceled
        logger.warn('Subscription not found in Stripe - marking as canceled', {
          subscriptionId: dbSub.stripeSubscriptionId
        });
        
        await db.collection('subscriptions').updateOne(
          { _id: dbSub._id },
          { $set: { status: 'canceled', updatedAt: new Date() } }
        );
      } else if (stripeSub.status !== dbSub.status) {
        // Status mismatch - update database
        logger.warn('Subscription status mismatch - updating database', {
          subscriptionId: dbSub.stripeSubscriptionId,
          stripeStatus: stripeSub.status,
          dbStatus: dbSub.status
        });
        
        await db.collection('subscriptions').updateOne(
          { _id: dbSub._id },
          { $set: { status: stripeSub.status, updatedAt: new Date() } }
        );
      }
    }
  }
}

module.exports = new ReconciliationService();