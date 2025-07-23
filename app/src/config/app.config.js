/**
 * Application Configuration
 * Central configuration for the MSaaS application
 */

const envs = process.env

console.log({
  envs
})

// Get environment variable with fallback
const getEnvVar = (key, defaultValue = '') => {
  return envs[key] || defaultValue;
};

export const appConfig = {
  // API Configuration
  api: {
    baseUrl: getEnvVar('VUE_APP_API_URL', 'http://localhost:3000'),
    timeout: 10000,
    retryAttempts: 3
  },

  // Authentication Configuration
  auth: {
    tokenKey: 'msaas_token',
    refreshTokenKey: 'msaas_refresh_token',
    tokenExpiry: 15 * 60 * 1000, // 15 minutes
    refreshThreshold: 5 * 60 * 1000 // 5 minutes before expiry
  },

  // Application Settings
  app: {
    name: getEnvVar('VUE_APP_NAME', 'MSaaS App'),
    version: getEnvVar('VUE_APP_VERSION', '1.0.0'),
    environment: getEnvVar('NODE_ENV', 'development'),
    debugMode: getEnvVar('VUE_APP_DEBUG', 'true') === 'true'
  },

  // UI Configuration
  ui: {
    theme: 'light',
    primaryColor: '#3b82f6',
    sidebarCollapsed: false,
    itemsPerPage: 10
  },

  // Feature Flags
  features: {
    enableNotifications: true,
    enableAnalytics: getEnvVar('VUE_APP_ANALYTICS', 'false') === 'true',
    enableBetaFeatures: getEnvVar('VUE_APP_BETA_FEATURES', 'false') === 'true'
  },

  // Stripe Configuration (for frontend)
  stripe: {
    publishableKey: getEnvVar('VUE_APP_STRIPE_PUBLISHABLE_KEY', ''),
    enableTestMode: getEnvVar('VUE_APP_STRIPE_TEST_MODE', 'true') === 'true'
  }
};

// Debug log configuration in development
if (appConfig.app.debugMode) {
  console.debug('App configuration loaded', appConfig);
}

export default appConfig;
