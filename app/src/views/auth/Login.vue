<!--
  Login Page Component
  User authentication login form
-->
<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to your account</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ 'form-input--error': errors.email }"
              placeholder="Enter your email"
              required
            />
            <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              :class="{ 'form-input--error': errors.password }"
              placeholder="Enter your password"
              required
            />
            <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn--primary btn--full"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Signing In...' : 'Sign In' }}
            </button>
          </div>
        </form>

        <div class="auth-footer">
          <p class="auth-link-text">
            Don't have an account?
            <router-link to="/register" class="auth-link">Sign up</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import { isValidEmail } from '@/utils/helpers';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const appStore = useAppStore();

    // Reactive state
    const isLoading = ref(false);
    const form = reactive({
      email: '',
      password: ''
    });
    const errors = reactive({
      email: '',
      password: ''
    });

    // Methods
    const validateForm = () => {
      let isValid = true;
      
      // Reset errors
      errors.email = '';
      errors.password = '';

      // Validate email
      if (!form.email) {
        errors.email = 'Email is required';
        isValid = false;
      } else if (!isValidEmail(form.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }

      // Validate password
      if (!form.password) {
        errors.password = 'Password is required';
        isValid = false;
      } else if (form.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
        isValid = false;
      }

      return isValid;
    };

    const handleLogin = async () => {
      if (!validateForm()) {
        return;
      }

      try {
        isLoading.value = true;
        
        await authStore.login({
          email: form.email,
          password: form.password
        });

        appStore.showSuccess('Welcome back!');
        
        // Redirect to dashboard or intended route
        const redirectTo = router.currentRoute.value.query.redirect || '/dashboard';
        router.push(redirectTo);
        
      } catch (error) {
        console.debug('Login failed', { error: error.message });
        appStore.showError(error.message || 'Login failed. Please try again.');
      } finally {
        isLoading.value = false;
      }
    };

    return {
      form,
      errors,
      isLoading,
      handleLogin
    };
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  padding: var(--spacing-lg);
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background-color: var(--color-background);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-2xl);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.auth-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm);
}

.auth-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background-color: var(--color-background);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input--error {
  border-color: var(--color-error);
}

.form-input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.form-actions {
  margin-top: var(--spacing-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn--full {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: var(--spacing-xl);
}

.auth-link-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.auth-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 640px) {
  .auth-page {
    padding: var(--spacing-md);
  }
  
  .auth-card {
    padding: var(--spacing-xl);
  }
  
  .auth-title {
    font-size: var(--font-size-2xl);
  }
}
</style>
