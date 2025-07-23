<!--
  404 Not Found Page Component
  Error page for non-existent routes
-->
<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-icon">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m9 9 6 6"></path>
          <path d="m15 9-6 6"></path>
        </svg>
      </div>
      
      <h1 class="error-title">404</h1>
      <h2 class="error-subtitle">Page Not Found</h2>
      <p class="error-description">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div class="error-actions">
        <router-link to="/" class="btn btn--primary">
          Go Home
        </router-link>
        <button @click="goBack" class="btn btn--outline">
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter();

    const goBack = () => {
      if (window.history.length > 1) {
        router.go(-1);
      } else {
        router.push('/');
      }
    };

    return {
      goBack
    };
  }
};
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: 6rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  line-height: 1;
}

.error-subtitle {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text);
  margin: var(--spacing-md) 0;
}

.error-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-2xl);
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn--outline {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn--outline:hover {
  background-color: var(--color-primary);
  color: white;
  transform: translateY(-1px);
}

/* Responsive design */
@media (max-width: 640px) {
  .error-title {
    font-size: 4rem;
  }
  
  .error-subtitle {
    font-size: 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 200px;
  }
}
</style>
