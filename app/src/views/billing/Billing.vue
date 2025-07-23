<!--
  Billing Page Component
  Subscription and billing management
-->
<template>
  <div class="billing-page">
    <div class="container">
      <h1 class="page-title">Billing</h1>
      <p class="page-subtitle">Manage your subscription and billing information</p>
      
      <div class="billing-content">
        <div class="billing-card">
          <h2>Coming Soon</h2>
          <p>Billing and subscription management features will be available soon.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Billing'
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
