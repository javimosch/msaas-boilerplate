<!--
  Home Page Component
  Landing page for the MSaaS application
-->
<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Welcome to {{ appConfig.app.name }}</h1>
        <p class="hero-subtitle">
          A modern MSaaS application built with Vue 3, featuring authentication,
          subscription management, and a beautiful user interface.
        </p>
        
        <div class="hero-actions">
          <router-link
            v-if="!authStore.isAuthenticated"
            to="/register"
            class="btn btn--primary btn--large"
          >
            Get Started
          </router-link>
          
          <router-link
            v-if="!authStore.isAuthenticated"
            to="/login"
            class="btn btn--outline btn--large"
          >
            Sign In
          </router-link>
          
          <router-link
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="btn btn--primary btn--large"
          >
            Go to Dashboard
          </router-link>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2 class="section-title">Features</h2>
        <div class="features-grid">
          <div class="feature-card" v-for="feature in features" :key="feature.title">
            <div class="feature-icon">
              <component :is="feature.icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to get started?</h2>
          <p class="cta-subtitle">
            Join thousands of users who trust our platform for their business needs.
          </p>
          <router-link
            v-if="!authStore.isAuthenticated"
            to="/register"
            class="btn btn--primary btn--large"
          >
            Start Your Free Trial
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth.store';
import { appConfig } from '@/config/app.config';

// Feature icons
const ShieldIcon = {
  template: `
    <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>
  `
};

const LightningIcon = {
  template: `
    <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
    </svg>
  `
};

const CogIcon = {
  template: `
    <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
    </svg>
  `
};

const ChartIcon = {
  template: `
    <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  `
};

export default {
  name: 'Home',
  components: {
    ShieldIcon,
    LightningIcon,
    CogIcon,
    ChartIcon
  },
  setup() {
    const authStore = useAuthStore();

    const features = [
      {
        icon: 'ShieldIcon',
        title: 'Secure & Reliable',
        description: 'Enterprise-grade security with JWT authentication and encrypted data storage.'
      },
      {
        icon: 'LightningIcon',
        title: 'Fast Performance',
        description: 'Built with modern technologies for lightning-fast load times and smooth interactions.'
      },
      {
        icon: 'CogIcon',
        title: 'Easy to Customize',
        description: 'Modular architecture makes it simple to extend and customize for your needs.'
      },
      {
        icon: 'ChartIcon',
        title: 'Analytics Ready',
        description: 'Built-in analytics and reporting features to track your business metrics.'
      }
    ];

    return {
      authStore,
      appConfig,
      features
    };
  }
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  padding: 8rem 2rem 6rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin: 0 0 3rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features-section {
  padding: 6rem 2rem;
  background-color: var(--color-surface);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 4rem;
  color: var(--color-text);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: var(--color-background);
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--color-text);
}

.feature-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.cta-section {
  padding: 6rem 2rem;
  background-color: var(--color-background);
  text-align: center;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--color-text);
}

.cta-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0 0 2rem;
  line-height: 1.6;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  cursor: pointer;
}

.btn--large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
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
  color: white;
  border-color: white;
}

.btn--outline:hover {
  background-color: white;
  color: var(--color-primary);
}

/* Responsive design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .cta-title {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-section {
    padding: 6rem 1rem 4rem;
  }
  
  .features-section,
  .cta-section {
    padding: 4rem 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
}
</style>
