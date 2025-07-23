<template>
  <div id="app" :data-theme="appStore.theme">
    <!-- Loading Overlay -->
    <LoadingOverlay v-if="appStore.isLoading" :message="appStore.loadingMessage" />
    
    <!-- Notification System -->
    <NotificationContainer :notifications="appStore.notifications" />
    
    <!-- Main Application Layout -->
    <div class="app-layout">
      <!-- Navigation Header -->
      <AppHeader v-if="showHeader" />
      
      <!-- Main Content Area -->
      <main class="main-content" :class="{ 'with-header': showHeader }">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import LoadingOverlay from '@/components/ui/LoadingOverlay.vue';
import NotificationContainer from '@/components/ui/NotificationContainer.vue';
import AppHeader from '@/components/layout/AppHeader.vue';

export default {
  name: 'App',
  components: {
    LoadingOverlay,
    NotificationContainer,
    AppHeader
  },
  setup() {
    const route = useRoute();
    const authStore = useAuthStore();
    const appStore = useAppStore();

    // Computed properties
    const showHeader = computed(() => {
      // Hide header on auth pages and landing page
      const hideHeaderRoutes = ['Login', 'Register', 'Home'];
      return !hideHeaderRoutes.includes(route.name);
    });

    // Initialize application
    onMounted(async () => {
      console.debug('App mounted, initializing...');
      
      try {
        // Initialize app store (theme, preferences)
        appStore.initializeApp();
        
        // Initialize authentication
        await authStore.initializeAuth();
        
        console.debug('App initialization completed');
      } catch (error) {
        console.debug('App initialization failed', { error: error.message });
        appStore.showError('Failed to initialize application');
      }
    });

    return {
      authStore,
      appStore,
      showHeader
    };
  }
};
</script>

<style>
/* CSS Variables for theming */
:root {
  /* Light theme colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #06b6d4;
  
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  
  --border-radius: 0.5rem;
  --border-radius-lg: 0.75rem;
  
  --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}

/* Dark theme colors */
[data-theme="dark"] {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
  --color-text: #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;
}

/* Global styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-surface);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-content.with-header {
  padding-top: 4rem; /* Account for fixed header */
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Utility classes */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }

.text-sm { font-size: var(--font-size-sm); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }

.text-primary { color: var(--color-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-muted { color: var(--color-text-muted); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }

.bg-primary { background-color: var(--color-primary); }
.bg-surface { background-color: var(--color-surface); }
.bg-background { background-color: var(--color-background); }

.border { border: 1px solid var(--color-border); }
.border-t { border-top: 1px solid var(--color-border); }
.border-b { border-bottom: 1px solid var(--color-border); }
.border-l { border-left: 1px solid var(--color-border); }
.border-r { border-right: 1px solid var(--color-border); }

.rounded { border-radius: var(--border-radius); }
.rounded-lg { border-radius: var(--border-radius-lg); }

.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }

.p-xs { padding: var(--spacing-xs); }
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
.p-xl { padding: var(--spacing-xl); }

.m-xs { margin: var(--spacing-xs); }
.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }
.m-xl { margin: var(--spacing-xl); }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.flex-1 { flex: 1; }

.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }

.w-full { width: 100%; }
.h-full { height: 100%; }
.min-h-screen { min-height: 100vh; }

/* Responsive utilities */
@media (max-width: 768px) {
  .md\:hidden { display: none; }
  .md\:block { display: block; }
}

@media (max-width: 640px) {
  .sm\:hidden { display: none; }
  .sm\:block { display: block; }
  .sm\:text-sm { font-size: var(--font-size-sm); }
}

/* Focus styles for accessibility */
*:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-surface);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
