/**
 * Application Store
 * Manages global application state and UI preferences
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { appConfig } from '@/config/app.config';

export const useAppStore = defineStore('app', () => {
  // State
  const theme = ref(appConfig.ui.theme);
  const sidebarCollapsed = ref(appConfig.ui.sidebarCollapsed);
  const notifications = ref([]);
  const isLoading = ref(false);
  const loadingMessage = ref('');

  // Getters
  const isDarkTheme = computed(() => theme.value === 'dark');
  const hasNotifications = computed(() => notifications.value.length > 0);
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read).length
  );

  // Actions
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme.value);
    
    // Persist theme preference
    localStorage.setItem('msaas_theme', theme.value);
    
    console.debug('Theme toggled', { newTheme: theme.value });
  };

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    
    // Persist sidebar state
    localStorage.setItem('msaas_sidebar_collapsed', sidebarCollapsed.value.toString());
    
    console.debug('Sidebar toggled', { collapsed: sidebarCollapsed.value });
  };

  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      type: 'info',
      read: false,
      timestamp: new Date(),
      ...notification
    };
    
    notifications.value.unshift(newNotification);
    
    console.debug('Notification added', { id, type: newNotification.type });
    
    // Auto-remove after delay for certain types
    if (newNotification.type === 'success' || newNotification.type === 'info') {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
      console.debug('Notification removed', { id });
    }
  };

  const markNotificationRead = (id) => {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      console.debug('Notification marked as read', { id });
    }
  };

  const clearAllNotifications = () => {
    notifications.value = [];
    console.debug('All notifications cleared');
  };

  const setLoading = (loading, message = '') => {
    isLoading.value = loading;
    loadingMessage.value = message;
    
    if (loading) {
      console.debug('Loading started', { message });
    } else {
      console.debug('Loading stopped');
    }
  };

  const showSuccess = (message, title = 'Success') => {
    return addNotification({
      type: 'success',
      title,
      message
    });
  };

  const showError = (message, title = 'Error') => {
    return addNotification({
      type: 'error',
      title,
      message
    });
  };

  const showWarning = (message, title = 'Warning') => {
    return addNotification({
      type: 'warning',
      title,
      message
    });
  };

  const showInfo = (message, title = 'Info') => {
    return addNotification({
      type: 'info',
      title,
      message
    });
  };

  const initializeApp = () => {
    console.debug('Initializing app store');
    
    // Load theme preference
    const savedTheme = localStorage.getItem('msaas_theme');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      theme.value = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    // Load sidebar state
    const savedSidebarState = localStorage.getItem('msaas_sidebar_collapsed');
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState === 'true';
    }
    
    console.debug('App store initialized', {
      theme: theme.value,
      sidebarCollapsed: sidebarCollapsed.value
    });
  };

  return {
    // State
    theme,
    sidebarCollapsed,
    notifications,
    isLoading,
    loadingMessage,
    
    // Getters
    isDarkTheme,
    hasNotifications,
    unreadNotifications,
    
    // Actions
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearAllNotifications,
    setLoading,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    initializeApp
  };
});
