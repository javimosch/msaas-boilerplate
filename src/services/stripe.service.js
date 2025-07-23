const { stripe } = require('../config/stripe');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class StripeService {
  async createCustomer(customerData) {
    try {
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          source: 'msaas-boilerplate'
        }
      });
      
      return customer;
    } catch (error) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }
  
  async createSubscription(userId, priceId, paymentMethodId) {
    try {
      const db = getDB();
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId
      });
      
      // Set as default payment method
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      // Get the price details to retrieve the product name
      const price = await stripe.prices.retrieve(priceId, {
        expand: ['product']
      });
      
      // Determine the plan name from the product or price
      const planName = price.product?.name || 
                       price.nickname || 
                       `${price.recurring?.interval_count || 1}-${price.recurring?.interval || 'month'} Plan`;
      
      // Create subscription with metadata containing the plan name
      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          name: planName,
          planId: priceId
        }
      });
      
      // Save subscription to database
      await this.saveSubscription(userId, subscription);
      
      return subscription;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }
  
  async saveSubscription(userId, stripeSubscription) {
    const db = getDB();
    
    const subscription = {
      userId: new ObjectId(userId),
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    // Upsert subscription
    await db.collection('subscriptions').replaceOne(
      { stripeSubscriptionId: stripeSubscription.id },
      subscription,
      { upsert: true }
    );
    
    // Update user subscription status
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'subscription.status': stripeSubscription.status,
          'subscription.currentPeriodStart': subscription.currentPeriodStart,
          'subscription.currentPeriodEnd': subscription.currentPeriodEnd,
          'subscription.planId': subscription.stripePriceId,
          'subscription.subscriptionId': stripeSubscription.id,
          'metadata.updatedAt': new Date()
        }
      }
    );
    
    return subscription;
  }
  
  async cancelSubscription(userId) {
    try {
      const db = getDB();
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!user || !user.subscription.subscriptionId) {
        throw new Error('No active subscription found');
      }
      
      const subscription = await stripe.subscriptions.update(
        user.subscription.subscriptionId,
        { cancel_at_period_end: true }
      );
      
      await this.saveSubscription(userId, subscription);
      
      return subscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }
  
  async getPlans() {
    try {
      const prices = await stripe.prices.list({
        active: true,
        type: 'recurring'
      });
      
      return prices.data;
    } catch (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }
  }
  
  async createCheckoutSession(userId, priceId) {
    try {
      const db = getDB();
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Create a checkout session
      let frontendUrl = process.env.FRONTEND_URL;
      
      // Validate and fix URL scheme if needed
      if (!frontendUrl) {
        throw new Error('FRONTEND_URL environment variable is not set');
      }
      
      // Ensure URL has proper scheme
      if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
        frontendUrl = `https://${frontendUrl}`;
      }
      
      // Remove trailing slash if present
      frontendUrl = frontendUrl.replace(/\/$/, '');
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          },
        ],
        mode: 'subscription',
        customer: user.stripeCustomerId,
        success_url: `${frontendUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${frontendUrl}/billing?canceled=true`,
        metadata: {
          userId: userId
        }
      });
      
      return session;
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }
}

module.exports = new StripeService();