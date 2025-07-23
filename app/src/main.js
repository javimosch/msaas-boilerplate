/**
 * Main Application Entry Point
 * Initializes Vue app with router, stores, and global configurations
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { appConfig } from './config/app.config';
import { useAuthStore } from '@/stores/auth.store';

// Debug log for application startup
console.debug('Starting MSaaS application', {
  environment: appConfig.app.environment,
  version: appConfig.app.version,
  debugMode: appConfig.app.debugMode
});

// Create Vue app instance
const app = createApp(App);

// Create Pinia store instance
const pinia = createPinia();

// Install plugins
app.use(pinia);

// Global properties
app.config.globalProperties.$appConfig = appConfig;

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error handler:', {
    error: error.message,
    component: instance?.$options.name || 'Unknown',
    info
  });
  
  // In production, you might want to send this to an error tracking service
  if (appConfig.app.environment === 'production') {
    // Example: errorTrackingService.captureException(error, { extra: { info } });
  }
};

// Global warning handler (development only)
if (appConfig.app.debugMode) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('Vue warning:', {
      message: msg,
      component: instance?.$options.name || 'Unknown',
      trace
    });
  };
}

// Initialize authentication and mount the app
const initializeApp = async () => {
  try {
    // Initialize authentication before mounting
    const authStore = useAuthStore();
    await authStore.initializeAuth();
    
    console.debug('Authentication initialized successfully');
    
    // Install router after auth initialization
    app.use(router);
    
    // Mount the app
    app.mount('#app');
    
    console.debug('MSaaS application mounted successfully', {
      mountedAt: '#app',
      routerReady: !!router,
      storeReady: !!pinia,
      authReady: true
    });
  } catch (error) {
    console.error('Failed to initialize application:', {
      error: error.message,
      stack: error.stack
    });
    
    // Even if auth initialization fails, mount the app
    // so users can still access public routes
    app.use(router);
    app.mount('#app');
    
    console.debug('MSaaS application mounted with auth initialization error');
  }
};

// Start the application
initializeApp();
