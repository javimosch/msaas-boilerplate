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
    // First, get a list of all active subscription IDs
    const subscriptionIds = [];
    let startingAfter = null;
    let hasMore = true;
    
    while (hasMore) {
      const params = {
        status: 'active',
        limit: 100,
        expand: ['data.items.data.price'] // Expand price data
      };
      
      // Only include starting_after when we have a value
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const response = await stripe.subscriptions.list(params);
      
      // Store only the IDs to fetch full details later
      response.data.forEach(sub => subscriptionIds.push(sub.id));
      
      hasMore = response.has_more;
      if (hasMore && response.data.length > 0) startingAfter = response.data[response.data.length - 1].id;
    }
    
    // Now fetch each subscription individually to get full details including price data
    const fullSubscriptions = [];
    for (const subId of subscriptionIds) {
      try {
        // Retrieve subscription with expanded price data
        const subscription = await stripe.subscriptions.retrieve(subId, {
          expand: ['items.data.price'] // This will expand the price object including its metadata
        });
        
        fullSubscriptions.push(subscription);
      } catch (error) {
        logger.error(`Failed to retrieve subscription ${subId}:`, error);
      }
    }
    
    logger.debug(`Retrieved ${fullSubscriptions.length} subscriptions from Stripe`);
    return fullSubscriptions;
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
      } else {
        // Check for updates needed
        const updates = {};
        let updateNeeded = false;
        
        // Check status
        if (stripeSub.status !== dbSub.status) {
          logger.warn('Subscription status mismatch - updating database', {
            subscriptionId: dbSub.stripeSubscriptionId,
            stripeStatus: stripeSub.status,
            dbStatus: dbSub.status
          });
          updates.status = stripeSub.status;
          updateNeeded = true;
        }
        
        // Extract the price information from the subscription
        const priceData = stripeSub.items.data[0]?.price;
        
        // Update price metadata if available
        if (priceData) {
          const stripePriceMetadata = priceData.metadata || {};
          
          // Store the raw price metadata
          updates.stripePriceMetadata = stripePriceMetadata;
          
          // Also update metadata fields from price data
          updates['metadata.updatedAt'] = new Date();
          updates['metadata.priceAmount'] = priceData.unit_amount;
          updates['metadata.priceCurrency'] = priceData.currency;
          updates['metadata.priceInterval'] = priceData.recurring?.interval;
          
          // Copy all price metadata fields to our custom metadata
          Object.keys(stripePriceMetadata).forEach(key => {
            updates[`metadata.${key}`] = stripePriceMetadata[key];
          });
          
          updateNeeded = true;
          logger.debug('Updating price metadata for subscription', {
            subscriptionId: dbSub.stripeSubscriptionId,
            priceId: priceData.id
          });
        }
        
        // Add any other fields that might need updating
        updates.currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
        updates.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
        updates.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
        
        // Only update if there are changes
        if (updateNeeded) {
          try {
            await db.collection('subscriptions').updateOne(
              { _id: dbSub._id },
              { $set: updates }
            );
            
            logger.info('Updated subscription record with latest data from Stripe', {
              subscriptionId: dbSub.stripeSubscriptionId
            });
          } catch (error) {
            logger.error('Failed to update subscription record', {
              subscriptionId: dbSub.stripeSubscriptionId,
              error: error.message
            });
          }
        }
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

          // Extract the price information from the subscription
          const priceData = stripeSub.items.data[0]?.price;
          if (!priceData) {
            throw new Error('Stripe price data is missing');
          }
          
          // Extract price metadata
          const stripePriceMetadata = priceData.metadata || {};
          
          // Create new subscription record
          const subscription = {
            userId: user._id,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId: priceData.id,
            stripePriceLookupKey: priceData.lookup_key,
            stripePriceMetadata: stripePriceMetadata, // Store raw price metadata
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              createdByReconciliation: true,
              priceAmount: priceData.unit_amount,
              priceCurrency: priceData.currency,
              priceInterval: priceData.recurring?.interval,
              ...stripePriceMetadata // Spread the price metadata into our custom metadata
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