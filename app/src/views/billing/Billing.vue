<!--
  Billing Page Component
  Subscription and billing management with Stripe Checkout integration
-->
<template>
  <div class="billing-page">
    <div class="container">
      <h1 class="page-title">Billing</h1>
      <p class="page-subtitle">Manage your subscription and billing information</p>
      
      <div v-if="isLoading" class="billing-loader">
        <div class="loader"></div>
        <p>Loading subscription information...</p>
      </div>
      
      <div v-else class="billing-content">
        <!-- Success Message -->
        <div v-if="checkoutSuccess" class="billing-alert billing-alert--success">
          <div class="alert-icon">✓</div>
          <div class="alert-content">
            <h3>Payment Successful!</h3>
            <p>Your subscription has been activated. Thank you for your business!</p>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="checkoutCanceled" class="billing-alert billing-alert--error">
          <div class="alert-icon">!</div>
          <div class="alert-content">
            <h3>Payment Canceled</h3>
            <p>Your subscription payment was canceled. You can try again whenever you're ready.</p>
          </div>
        </div>
        
        <!-- Current Subscription -->
        <div class="billing-card">
          <h2>Your Subscription</h2>
          
          <div v-if="activeSubscription" class="subscription-info">
            <div class="subscription-status">
              <span class="status-badge" :class="statusClass">{{ subscription?.status || 'inactive' }}</span>
            </div>
            
            <div class="subscription-details">
              <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">{{ currentPlanName }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">{{ subscription?.status || 'Unknown' }}</span>
              </div>
              
              <div v-if="subscriptionActive" class="detail-row">
                <span class="detail-label">Current Period:</span>
                <span class="detail-value">{{ formattedPeriod }}</span>
              </div>
            </div>
            
            <div v-if="subscriptionActive" class="subscription-actions">
              <button 
                @click="cancelSubscription"
                class="btn btn--secondary btn--medium"
                :disabled="isCanceling">
                {{ isCanceling ? 'Canceling...' : 'Cancel Subscription' }}
              </button>
            </div>
          </div>
          
          <div v-else class="no-subscription">
            <p>You don't have an active subscription yet.</p>
            <p>Select a plan below to get started!</p>
          </div>
        </div>
        
        <!-- Available Plans -->
        <div class="billing-card">
          <h2>Available Plans</h2>
          
          <div v-if="plans.length" class="plans-grid">
            <div 
              v-for="plan in plans" 
              :key="plan.id"
              class="plan-card"
              :class="{'plan-card--active': isPlanActive(plan.id)}">
              <div class="plan-header">
                <h3 class="plan-name">{{ getPlanName(plan) }}</h3>
                <div class="plan-price">
                  <span class="price-amount">${{ plan.unit_amount / 100 }}</span>
                  <span class="price-interval">/ {{ plan.recurring.interval }}</span>
                </div>
              </div>
              
              <div class="plan-features">
                <ul>
                  <li>{{ getFeaturesFromMetadata(plan) }}</li>
                </ul>
              </div>
              
              <div class="plan-action">
                <button 
                  v-if="!isPlanActive(plan.id)"
                  @click="subscribeToPlan(plan.id)"
                  class="btn btn--primary btn--medium"
                  :disabled="isCheckoutLoading">
                  {{ isCheckoutLoading ? 'Processing...' : 'Subscribe' }}
                </button>
                <span v-else class="current-plan-label">Current Plan</span>
              </div>
            </div>
          </div>
          
          <div v-else class="no-plans">
            <p>No subscription plans are currently available.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import { subscriptionService } from '@/services/subscription.service';

export default {
  name: 'Billing',
  
  setup() {
    // Stores
    const authStore = useAuthStore();
    const appStore = useAppStore();
    const route = useRoute();
    
    // Reactive state
    const isLoading = ref(true);
    const isCheckoutLoading = ref(false);
    const isCanceling = ref(false);
    const plans = ref([]);
    const subscription = ref(null);
    
    // Check for URL parameters from Stripe redirect
    const checkoutSuccess = computed(() => {
      return route.query.success === 'true' && route.query.session_id;
    });
    
    const checkoutCanceled = computed(() => {
      return route.query.canceled === 'true';
    });
    
    // Computed properties
    const activeSubscription = computed(() => {
      return subscription.value && subscription.value.status;
    });
    
    const subscriptionActive = computed(() => {
      return [
        'active', 
        'trialing'
      ].includes(subscription.value?.status);
    });
    
    const statusClass = computed(() => {
      const status = subscription.value?.status || '';
      
      if (['active', 'trialing'].includes(status)) {
        return 'status-badge--active';
      } else if (status === 'canceled') {
        return 'status-badge--canceled';
      } else {
        return 'status-badge--inactive';
      }
    });
    
    const currentPlanName = computed(() => {
      if (!subscription.value?.planId) return 'None';
      
      const plan = plans.value.find(p => p.id === subscription.value.planId);
      return getPlanName(plan) || 'Unknown Plan';
    });
    
    const formattedPeriod = computed(() => {
      if (!subscription.value?.currentPeriodStart || !subscription.value?.currentPeriodEnd) {
        return 'N/A';
      }
      
      const start = new Date(subscription.value.currentPeriodStart);
      const end = new Date(subscription.value.currentPeriodEnd);
      
      return `${formatDate(start)} - ${formatDate(end)}`;
    });
    
    // Helper functions
    const formatDate = (date) => {
      if (!date) return '';
      return date.toLocaleDateString();
    };
    
    const getPlanName = (plan) => {
      if (!plan) return 'Unknown';
      
      // Try to get name from metadata
      if (plan.metadata && plan.metadata.name) {
        return plan.metadata.name;
      }
      
      // Fallback: Capitalize the product name or use a generic name
      return plan.nickname || `${plan.interval_count}-${plan.recurring.interval} Plan`;
    };
    
    const getFeaturesFromMetadata = (plan) => {
      if (plan.metadata && plan.metadata.features) {
        return plan.metadata.features;
      }
      
      // Default features based on price
      const price = plan.unit_amount / 100;
      if (price < 10) {
        return 'Basic features';
      } else if (price < 30) {
        return 'All basic features plus advanced tools';
      } else {
        return 'Full access to all platform features and priority support';
      }
    };
    
    const isPlanActive = (planId) => {
      return subscription.value && 
             subscription.value.planId === planId && 
             subscriptionActive.value;
    };
    
    // Methods
    const loadPlansAndSubscription = async () => {
      try {
        isLoading.value = true;
        
        // Load available plans
        const plansResponse = await subscriptionService.getPlans();
        plans.value = plansResponse.data?.plans || [];
        
        // Load current subscription status
        const subscriptionResponse = await subscriptionService.getSubscriptionStatus();
        subscription.value = subscriptionResponse.data?.userSubscription || null;
        
        console.debug('Subscription data loaded', { 
          plansCount: plans.value.length,
          subscription: subscription.value 
        });
      } catch (error) {
        console.error('Failed to load subscription data', error);
        appStore.showError('Failed to load subscription information. Please try again.');
      } finally {
        isLoading.value = false;
      }
    };
    
    const subscribeToPlan = async (priceId) => {
      try {
        isCheckoutLoading.value = true;
        
        const response = await subscriptionService.createCheckoutSession(priceId);
        const sessionUrl = response.data?.session?.url;
        
        if (sessionUrl) {
          // Redirect to Stripe Checkout
          window.location.href = sessionUrl;
        } else {
          throw new Error('Invalid checkout session response');
        }
      } catch (error) {
        console.error('Failed to start checkout', error);
        appStore.showError('Failed to initiate checkout. Please try again.');
        isCheckoutLoading.value = false;
      }
    };
    
    const cancelSubscription = async () => {
      try {
        if (!confirm('Are you sure you want to cancel your subscription?')) {
          return;
        }
        
        isCanceling.value = true;
        await subscriptionService.cancelSubscription();
        
        // Refresh subscription data
        await loadPlansAndSubscription();
        
        appStore.showSuccess('Your subscription has been canceled.');
      } catch (error) {
        console.error('Failed to cancel subscription', error);
        appStore.showError('Failed to cancel subscription. Please try again.');
      } finally {
        isCanceling.value = false;
      }
    };
    
    // Lifecycle hooks
    onMounted(() => {
      // Load data
      loadPlansAndSubscription();
    });
    
    return {
      // State
      isLoading,
      isCheckoutLoading,
      isCanceling,
      plans,
      subscription,
      checkoutSuccess,
      checkoutCanceled,
      
      // Computed
      activeSubscription,
      subscriptionActive,
      statusClass,
      currentPlanName,
      formattedPeriod,
      
      // Methods
      subscribeToPlan,
      cancelSubscription,
      getPlanName,
      getFeaturesFromMetadata,
      isPlanActive
    };
  }
};
</script>

<style scoped>
.billing-page {
  padding: var(--spacing-xl) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--color-text);
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0 0 2rem;
}

.billing-content {
  background-color: var(--color-background);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.billing-card {
  padding: var(--spacing-2xl);
  text-align: center;
}
</style>
