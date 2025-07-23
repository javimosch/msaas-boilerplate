<!--
  Profile Page Component
  User profile management
-->
<template>
  <div class="profile-page">
    <div class="container">
      <h1 class="page-title">Profile</h1>
      <p class="page-subtitle">Manage your account information</p>
      
      <div class="profile-content">
        <div class="profile-card">
          <h2>Coming Soon</h2>
          <p>Profile management features will be available soon.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Profile'
};
</script>

<style scoped>
.profile-page {
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

.profile-content {
  background-color: var(--color-background);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.profile-card {
  padding: var(--spacing-2xl);
  text-align: center;
}
</style>
