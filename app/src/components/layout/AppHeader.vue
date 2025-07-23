<!--
  Application Header Component
  Main navigation header with user menu and app controls
-->
<template>
  <header class="app-header">
    <div class="header-content">
      <!-- Logo and Brand -->
      <div class="header-brand">
        <router-link to="/dashboard" class="brand-link">
          <div class="brand-logo">
            <LogoIcon />
          </div>
          <span class="brand-text">{{ appConfig.app.name }}</span>
        </router-link>
      </div>

      <!-- Navigation Links -->
      <nav class="header-nav" v-if="!isMobile">
        <router-link
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          class="nav-link"
          :class="{ 'nav-link--active': $route.name === item.name }"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <!-- Header Actions -->
      <div class="header-actions">
        <!-- Theme Toggle -->
        <button
          class="action-button"
          @click="appStore.toggleTheme"
          :title="isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <component :is="isDarkTheme ? 'SunIcon' : 'MoonIcon'" />
        </button>

        <!-- Notifications -->
        <div class="notification-dropdown" v-if="appStore.hasNotifications">
          <button class="action-button notification-button" @click="toggleNotifications">
            <BellIcon />
            <span v-if="appStore.unreadNotifications > 0" class="notification-badge">
              {{ appStore.unreadNotifications }}
            </span>
          </button>
        </div>

        <!-- User Menu -->
        <div class="user-menu" v-if="authStore.isAuthenticated">
          <button class="user-button" @click="toggleUserMenu">
            <div class="user-avatar">
              {{ userInitials }}
            </div>
            <span class="user-name">{{ authStore.userName }}</span>
            <ChevronDownIcon class="user-chevron" />
          </button>

          <!-- User Dropdown -->
          <div v-if="showUserMenu" class="user-dropdown" @click.stop>
            <div class="user-info">
              <div class="user-avatar user-avatar--large">
                {{ userInitials }}
              </div>
              <div class="user-details">
                <p class="user-display-name">{{ authStore.userName }}</p>
                <p class="user-email">{{ authStore.user?.email }}</p>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <router-link to="/profile" class="dropdown-item" @click="closeUserMenu">
              <UserIcon />
              Profile
            </router-link>
            
            <router-link to="/settings" class="dropdown-item" @click="closeUserMenu">
              <SettingsIcon />
              Settings
            </router-link>
            
            <router-link to="/billing" class="dropdown-item" @click="closeUserMenu">
              <CreditCardIcon />
              Billing
            </router-link>
            
            <div class="dropdown-divider"></div>
            
            <button class="dropdown-item dropdown-item--danger" @click="handleLogout">
              <LogoutIcon />
              Sign Out
            </button>
          </div>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          v-if="isMobile"
          class="action-button mobile-menu-toggle"
          @click="toggleMobileMenu"
        >
          <component :is="showMobileMenu ? 'XIcon' : 'MenuIcon'" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div v-if="isMobile && showMobileMenu" class="mobile-nav">
      <router-link
        v-for="item in navigationItems"
        :key="item.name"
        :to="item.path"
        class="mobile-nav-link"
        :class="{ 'mobile-nav-link--active': $route.name === item.name }"
        @click="closeMobileMenu"
      >
        {{ item.label }}
      </router-link>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import { appConfig } from '@/config/app.config';

// Simple icon components (replace with your preferred icon library)
const LogoIcon = {
  template: `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
      <rect width="32" height="32" rx="8" fill="currentColor"/>
      <text x="16" y="22" text-anchor="middle" fill="white" font-size="16" font-weight="bold">M</text>
    </svg>
  `
};

const SunIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
    </svg>
  `
};

const MoonIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  `
};

const BellIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  `
};

const UserIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
    </svg>
  `
};

const SettingsIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
    </svg>
  `
};

const CreditCardIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
    </svg>
  `
};

const LogoutIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
    </svg>
  `
};

const ChevronDownIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `
};

const MenuIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
    </svg>
  `
};

const XIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  `
};

export default {
  name: 'AppHeader',
  components: {
    LogoIcon,
    SunIcon,
    MoonIcon,
    BellIcon,
    UserIcon,
    SettingsIcon,
    CreditCardIcon,
    LogoutIcon,
    ChevronDownIcon,
    MenuIcon,
    XIcon
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const appStore = useAppStore();

    // Reactive state
    const showUserMenu = ref(false);
    const showNotifications = ref(false);
    const showMobileMenu = ref(false);
    const isMobile = ref(false);

    // Computed properties
    const isDarkTheme = computed(() => appStore.isDarkTheme);
    
    const userInitials = computed(() => {
      if (!authStore.user) return 'U';
      const firstName = authStore.user.firstName || '';
      const lastName = authStore.user.lastName || '';
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
    });

    const navigationItems = [
      { name: 'Dashboard', path: '/dashboard', label: 'Dashboard' },
      { name: 'Profile', path: '/profile', label: 'Profile' },
      { name: 'Settings', path: '/settings', label: 'Settings' },
      { name: 'Billing', path: '/billing', label: 'Billing' }
    ];

    // Methods
    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value;
      showNotifications.value = false;
    };

    const closeUserMenu = () => {
      showUserMenu.value = false;
    };

    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value;
      showUserMenu.value = false;
    };

    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value;
    };

    const closeMobileMenu = () => {
      showMobileMenu.value = false;
    };

    const handleLogout = async () => {
      try {
        await authStore.logout();
        router.push('/');
        appStore.showSuccess('Logged out successfully');
      } catch (error) {
        appStore.showError('Failed to logout');
      }
      closeUserMenu();
    };

    const handleResize = () => {
      isMobile.value = window.innerWidth < 768;
      if (!isMobile.value) {
        showMobileMenu.value = false;
      }
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu')) {
        showUserMenu.value = false;
      }
      if (!event.target.closest('.notification-dropdown')) {
        showNotifications.value = false;
      }
    };

    // Lifecycle
    onMounted(() => {
      handleResize();
      window.addEventListener('resize', handleResize);
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      authStore,
      appStore,
      appConfig,
      showUserMenu,
      showNotifications,
      showMobileMenu,
      isMobile,
      isDarkTheme,
      userInitials,
      navigationItems,
      toggleUserMenu,
      closeUserMenu,
      toggleNotifications,
      toggleMobileMenu,
      closeMobileMenu,
      handleLogout
    };
  }
};
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  height: 4rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
  font-size: var(--font-size-lg);
}

.brand-logo {
  color: var(--color-primary);
}

.brand-text {
  color: var(--color-text);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.nav-link {
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link--active {
  color: var(--color-primary);
  background-color: var(--color-surface);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  color: var(--color-text);
  background-color: var(--color-surface);
}

.notification-dropdown {
  position: relative;
}

.notification-button {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: var(--color-error);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: none;
  color: var(--color-text);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-button:hover {
  background-color: var(--color-surface);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.user-avatar--large {
  width: 48px;
  height: 48px;
  font-size: var(--font-size-lg);
}

.user-name {
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chevron {
  transition: transform 0.2s ease;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--spacing-xs);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  min-width: 240px;
  z-index: 1000;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-display-name {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-xs) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text);
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: var(--color-surface);
}

.dropdown-item--danger {
  color: var(--color-error);
}

.dropdown-item--danger:hover {
  background-color: var(--color-error);
  color: white;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.mobile-nav-link {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
}

.mobile-nav-link:hover,
.mobile-nav-link--active {
  color: var(--color-primary);
  background-color: var(--color-surface);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    padding: 0 var(--spacing-md);
  }
  
  .brand-text {
    display: none;
  }
  
  .user-name {
    display: none;
  }
  
  .user-dropdown {
    right: auto;
    left: 0;
    min-width: 200px;
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 0 var(--spacing-sm);
  }
}
</style>
