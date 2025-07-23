/**
 * Vue Router Configuration
 * Defines application routes and navigation guards
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

// Lazy load components for better performance
const Home = () => import('@/views/Home.vue');
const Login = () => import('@/views/auth/Login.vue');
const Register = () => import('@/views/auth/Register.vue');
const Dashboard = () => import('@/views/Dashboard.vue');
const Profile = () => import('@/views/user/Profile.vue');
const Settings = () => import('@/views/user/Settings.vue');
const Billing = () => import('@/views/billing/Billing.vue');
const NotFound = () => import('@/views/errors/NotFound.vue');

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false, title: 'Home' }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, title: 'Login', hideForAuth: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false, title: 'Register', hideForAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, title: 'Dashboard' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true, title: 'Profile' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true, title: 'Settings' }
  },
  {
    path: '/billing',
    name: 'Billing',
    component: Billing,
    meta: { requiresAuth: true, title: 'Billing' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: 'Page Not Found' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Set page title
  document.title = to.meta?.title ? `${to.meta.title} - MSaaS App` : 'MSaaS App';
  
  // Check if route requires authentication
  if (to.meta?.requiresAuth) {
    if (!authStore.isAuthenticated) {
      console.debug('Route requires auth, redirecting to login', { route: to.path });
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
  }
  
  // Hide routes for authenticated users (like login/register)
  if (to.meta?.hideForAuth && authStore.isAuthenticated) {
    console.debug('Route hidden for authenticated users, redirecting to dashboard');
    next({ name: 'Dashboard' });
    return;
  }
  
  next();
});

export default router;
