/**
 * Subscription Service
 * Handles API calls related to subscriptions and billing
 */
import { apiService } from './api';

class SubscriptionService {
  /**
   * Get all available subscription plans
   * @returns {Promise} - The plans response
   */
  async getPlans() {
    return apiService.get('/api/subscriptions/plans');
  }
  
  /**
   * Get current subscription status
   * @returns {Promise} - The subscription status response
   */
  async getSubscriptionStatus() {
    return apiService.get('/api/subscriptions/status');
  }
  
  /**
   * Create a Stripe Checkout session
   * @param {string} priceId - The Stripe price ID
   * @returns {Promise} - The checkout session response
   */
  async createCheckoutSession(priceId) {
    return apiService.post('/api/subscriptions/create-checkout-session', { priceId });
  }
  
  /**
   * Cancel the current subscription
   * @returns {Promise} - The cancellation response
   */
  async cancelSubscription() {
    return apiService.delete('/api/subscriptions/cancel');
  }

  /**
   * Check if user is subscribed to a price by lookup key
   * @param {string} lookupKey - The price lookup key
   * @returns {Promise} - Response with { subscribed: boolean, trial: boolean }
   */
  async isUserSubscribedToPriceLookUpKey(lookupKey) {
    return apiService.get(`/api/subscriptions/check-by-lookup-key/${lookupKey}`);
  }

  /**
   * Check if user is subscribed to a price by metadata name
   * @param {string} metadataName - The product metadata name
   * @returns {Promise} - Response with { subscribed: boolean, trial: boolean }
   */
  async isUserSubscribedToPriceMatchingMetadataName(metadataName) {
    return apiService.get(`/api/subscriptions/check-by-metadata-name/${metadataName}`);
  }

  /**
   * Check if user is subscribed to a specific price ID
   * @param {string} priceId - The Stripe price ID
   * @returns {Promise} - Response with { subscribed: boolean, trial: boolean }
   */
  async isUserSubscribedToPriceId(priceId) {
    return apiService.get(`/api/subscriptions/check-by-price-id/${priceId}`);
  }
}

export const subscriptionService = window.subscriptionService = new SubscriptionService();
