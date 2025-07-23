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
    
    // Create map of database subscriptions by stripeSubscriptionId
    const dbSubMap = new Map();
    dbSubs.forEach(sub => dbSubMap.set(sub.stripeSubscriptionId, sub));
    
    // Create map of Stripe subscriptions by ID for quick lookup
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
    
    // Check Stripe subscriptions against database - create missing records
    for (const stripeSub of stripeSubs) {
      if (!dbSubMap.has(stripeSub.id)) {
        // Subscription exists in Stripe but not in database - create it
        logger.warn('Active Stripe subscription not found in database - creating record', {
          stripeSubscriptionId: stripeSub.id,
          stripeCustomerId: stripeSub.customer
        });
        
        try {
          // Find user by stripeCustomerId
          const user = await db.collection('users').findOne({
            stripeCustomerId: stripeSub.customer
          });
          
          if (!user) {
            logger.error('User not found for stripeCustomerId - cannot create subscription record', {
              stripeCustomerId: stripeSub.customer,
              stripeSubscriptionId: stripeSub.id
            });
            continue;
          }
          
          // Create new subscription record
          const subscription = {
            userId: user._id,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId: stripeSub.items.data[0]?.price?.id || null,
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              createdByReconciliation: true
            }
          };
          
          await db.collection('subscriptions').insertOne(subscription);
          
          // Update user's subscription status
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                'subscription.status': stripeSub.status,
                'subscription.currentPeriodStart': subscription.currentPeriodStart,
                'subscription.currentPeriodEnd': subscription.currentPeriodEnd,
                'subscription.planId': subscription.stripePriceId,
                'subscription.subscriptionId': stripeSub.id,
                'metadata.updatedAt': new Date()
              }
            }
          );
          
          logger.info('Created missing subscription record', {
            userId: user._id.toString(),
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: stripeSub.customer
          });
          
        } catch (error) {
          logger.error('Failed to create missing subscription record', {
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: stripeSub.customer,
            error: error.message
          });
        }
      }
    }
  }
}

module.exports = new ReconciliationService();