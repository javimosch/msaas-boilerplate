<!--
  Notification Container Component
  Displays toast notifications with different types and auto-dismiss functionality
-->
<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification',
          `notification--${notification.type}`,
          { 'notification--read': notification.read }
        ]"
        @click="markAsRead(notification.id)"
      >
        <div class="notification-icon">
          <component :is="getIcon(notification.type)" />
        </div>
        
        <div class="notification-content">
          <h4 v-if="notification.title" class="notification-title">
            {{ notification.title }}
          </h4>
          <p class="notification-message">
            {{ notification.message }}
          </p>
        </div>
        
        <button
          class="notification-close"
          @click.stop="removeNotification(notification.id)"
          aria-label="Close notification"
        >
          <CloseIcon />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { useAppStore } from '@/stores/app.store';

// Simple icon components (you can replace with your preferred icon library)
const CheckIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
  `
};

const ErrorIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `
};

const WarningIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `
};

const InfoIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>
  `
};

const CloseIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `
};

export default {
  name: 'NotificationContainer',
  components: {
    CheckIcon,
    ErrorIcon,
    WarningIcon,
    InfoIcon,
    CloseIcon
  },
  props: {
    notifications: {
      type: Array,
      required: true
    }
  },
  setup() {
    const appStore = useAppStore();

    const getIcon = (type) => {
      const icons = {
        success: 'CheckIcon',
        error: 'ErrorIcon',
        warning: 'WarningIcon',
        info: 'InfoIcon'
      };
      return icons[type] || 'InfoIcon';
    };

    const markAsRead = (id) => {
      appStore.markNotificationRead(id);
    };

    const removeNotification = (id) => {
      appStore.removeNotification(id);
    };

    return {
      getIcon,
      markAsRead,
      removeNotification
    };
  }
};
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 1000;
  max-width: 400px;
  width: 100%;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  background-color: var(--color-background);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid var(--color-border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification:hover {
  transform: translateX(-4px);
  box-shadow: var(--shadow-lg);
}

.notification--success {
  border-left-color: var(--color-success);
}

.notification--error {
  border-left-color: var(--color-error);
}

.notification--warning {
  border-left-color: var(--color-warning);
}

.notification--info {
  border-left-color: var(--color-info);
}

.notification--read {
  opacity: 0.7;
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification--success .notification-icon {
  color: var(--color-success);
}

.notification--error .notification-icon {
  color: var(--color-error);
}

.notification--warning .notification-icon {
  color: var(--color-warning);
}

.notification--info .notification-icon {
  color: var(--color-info);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.notification-message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.notification-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.notification-close:hover {
  color: var(--color-text);
  background-color: var(--color-surface);
}

/* Transitions */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .notification-container {
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    left: var(--spacing-sm);
    max-width: none;
  }
  
  .notification {
    padding: var(--spacing-sm);
  }
  
  .notification-title {
    font-size: var(--font-size-sm);
  }
  
  .notification-message {
    font-size: var(--font-size-sm);
  }
}
</style>
