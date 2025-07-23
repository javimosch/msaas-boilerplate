/**
 * Subscription Service
 * Handles API calls related to subscriptions and billing
 */
import { apiClient } from './api';

class SubscriptionService {
  /**
   * Get all available subscription plans
   * @returns {Promise} - The plans response
   */
  async getPlans() {
    return apiClient.get('/api/subscriptions/plans');
  }
  
  /**
   * Get current subscription status
   * @returns {Promise} - The subscription status response
   */
  async getSubscriptionStatus() {
    return apiClient.get('/api/subscriptions/status');
  }
  
  /**
   * Create a Stripe Checkout session
   * @param {string} priceId - The Stripe price ID
   * @returns {Promise} - The checkout session response
   */
  async createCheckoutSession(priceId) {
    return apiClient.post('/api/subscriptions/create-checkout-session', { priceId });
  }
  
  /**
   * Cancel the current subscription
   * @returns {Promise} - The cancellation response
   */
  async cancelSubscription() {
    return apiClient.delete('/api/subscriptions/cancel');
  }
}

export const subscriptionService = new SubscriptionService();
