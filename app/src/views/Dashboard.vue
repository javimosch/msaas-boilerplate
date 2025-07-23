<!--
  Dashboard Component
  Main dashboard view for authenticated users
-->
<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <div class="container">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back, {{ authStore.userName }}!</p>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="container">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card" v-for="stat in stats" :key="stat.title">
            <div class="stat-icon" :class="`stat-icon--${stat.type}`">
              <component :is="stat.icon" />
            </div>
            <div class="stat-content">
              <h3 class="stat-title">{{ stat.title }}</h3>
              <p class="stat-value">{{ stat.value }}</p>
              <p class="stat-change" :class="stat.changeClass">
                {{ stat.change }}
              </p>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Recent Activity -->
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Recent Activity</h2>
              <button class="btn btn--sm btn--outline">View All</button>
            </div>
            <div class="card-content">
              <div v-if="activities.length === 0" class="empty-state">
                <p>No recent activity to show.</p>
              </div>
              <div v-else class="activity-list">
                <div
                  v-for="activity in activities"
                  :key="activity.id"
                  class="activity-item"
                >
                  <div class="activity-icon" :class="`activity-icon--${activity.type}`">
                    <component :is="activity.icon" />
                  </div>
                  <div class="activity-content">
                    <p class="activity-text">{{ activity.text }}</p>
                    <p class="activity-time">{{ formatTime(activity.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Quick Actions</h2>
            </div>
            <div class="card-content">
              <div class="actions-grid">
                <button
                  v-for="action in quickActions"
                  :key="action.title"
                  class="action-button"
                  @click="handleAction(action.action)"
                >
                  <div class="action-icon">
                    <component :is="action.icon" />
                  </div>
                  <span class="action-title">{{ action.title }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Account Status -->
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Account Status</h2>
            </div>
            <div class="card-content">
              <div class="status-item">
                <span class="status-label">Subscription</span>
                <span class="status-value status-value--active">
                  {{ subscriptionStatus }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Account Type</span>
                <span class="status-value">{{ authStore.userRole }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Member Since</span>
                <span class="status-value">{{ memberSince }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';

// Icons
const UsersIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  `
};

const ChartIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  `
};

const CurrencyIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
    </svg>
  `
};

const ClockIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
    </svg>
  `
};

const PlusIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
    </svg>
  `
};

const SettingsIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
    </svg>
  `
};

const UserIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
    </svg>
  `
};

const CreditCardIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
    </svg>
  `
};

export default {
  name: 'Dashboard',
  components: {
    UsersIcon,
    ChartIcon,
    CurrencyIcon,
    ClockIcon,
    PlusIcon,
    SettingsIcon,
    UserIcon,
    CreditCardIcon
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const appStore = useAppStore();

    // Reactive data
    const activities = ref([]);

    // Computed properties
    const subscriptionStatus = computed(() => {
      return authStore.user?.subscription?.status || 'Free';
    });

    const memberSince = computed(() => {
      if (!authStore.user?.metadata?.createdAt) return 'Unknown';
      return new Date(authStore.user.metadata.createdAt).toLocaleDateString();
    });

    // Mock data
    const stats = [
      {
        title: 'Total Users',
        value: '1,234',
        change: '+12% from last month',
        changeClass: 'stat-change--positive',
        icon: 'UsersIcon',
        type: 'primary'
      },
      {
        title: 'Revenue',
        value: '$12,345',
        change: '+8% from last month',
        changeClass: 'stat-change--positive',
        icon: 'CurrencyIcon',
        type: 'success'
      },
      {
        title: 'Growth',
        value: '23.5%',
        change: '+2.1% from last month',
        changeClass: 'stat-change--positive',
        icon: 'ChartIcon',
        type: 'info'
      },
      {
        title: 'Active Time',
        value: '2.5h',
        change: 'Today',
        changeClass: 'stat-change--neutral',
        icon: 'ClockIcon',
        type: 'warning'
      }
    ];

    const quickActions = [
      {
        title: 'New Project',
        icon: 'PlusIcon',
        action: 'create-project'
      },
      {
        title: 'Settings',
        icon: 'SettingsIcon',
        action: 'settings'
      },
      {
        title: 'Profile',
        icon: 'UserIcon',
        action: 'profile'
      },
      {
        title: 'Billing',
        icon: 'CreditCardIcon',
        action: 'billing'
      }
    ];

    // Methods
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString();
    };

    const handleAction = (action) => {
      console.debug('Quick action clicked', { action });
      
      switch (action) {
        case 'create-project':
          appStore.showInfo('Project creation feature coming soon!');
          break;
        case 'settings':
          router.push('/settings');
          break;
        case 'profile':
          router.push('/profile');
          break;
        case 'billing':
          router.push('/billing');
          break;
        default:
          appStore.showInfo(`${action} feature coming soon!`);
      }
    };

    const loadDashboardData = async () => {
      try {
        appStore.setLoading(true, 'Loading dashboard...');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock activities
        activities.value = [
          {
            id: 1,
            type: 'success',
            icon: 'UserIcon',
            text: 'Profile updated successfully',
            timestamp: Date.now() - 300000
          },
          {
            id: 2,
            type: 'info',
            icon: 'SettingsIcon',
            text: 'Settings synchronized',
            timestamp: Date.now() - 900000
          }
        ];
        
        console.debug('Dashboard data loaded');
      } catch (error) {
        console.debug('Failed to load dashboard data', { error: error.message });
        appStore.showError('Failed to load dashboard data');
      } finally {
        appStore.setLoading(false);
      }
    };

    // Lifecycle
    onMounted(() => {
      loadDashboardData();
    });

    return {
      authStore,
      appStore,
      activities,
      subscriptionStatus,
      memberSince,
      stats,
      quickActions,
      formatTime,
      handleAction
    };
  }
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background-color: var(--color-surface);
}

.dashboard-header {
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  padding: 2rem 0;
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
  margin: 0;
}

.dashboard-content {
  padding: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: var(--color-background);
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon--primary { background-color: var(--color-primary); }
.stat-icon--success { background-color: var(--color-success); }
.stat-icon--info { background-color: var(--color-info); }
.stat-icon--warning { background-color: var(--color-warning); }

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0 0 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.stat-change {
  font-size: 0.75rem;
  margin: 0;
}

.stat-change--positive { color: var(--color-success); }
.stat-change--negative { color: var(--color-error); }
.stat-change--neutral { color: var(--color-text-muted); }

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.content-card {
  background-color: var(--color-background);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.card-content {
  padding: 1.5rem;
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 2rem 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.activity-icon--success { background-color: var(--color-success); }
.activity-icon--info { background-color: var(--color-info); }
.activity-icon--warning { background-color: var(--color-warning); }
.activity-icon--error { background-color: var(--color-error); }

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: var(--color-background);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.action-icon {
  color: var(--color-primary);
}

.action-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.status-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.status-value--active {
  color: var(--color-success);
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn--outline {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn--outline:hover {
  background-color: var(--color-primary);
  color: white;
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 640px) {
  .container {
    padding: 0 var(--spacing-sm);
  }
  
  .dashboard-header {
    padding: 1.5rem 0;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .card-content {
    padding: 1rem;
  }
}
</style>
