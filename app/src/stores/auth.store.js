/**
 * Authentication Store
 * Manages user authentication state and operations
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';
import { tokenService } from '@/services/token.service';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const token = ref(null);
  const refreshToken = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role || 'user');
  const userName = computed(() => {
    if (!user.value) return '';
    return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim();
  });

  // Actions
  const login = async (credentials) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.debug('Attempting login', { email: credentials.email });
      
      const response = await authService.login(credentials);
      
      // Store tokens and user data
      token.value = response.token;
      refreshToken.value = response.refreshToken;
      user.value = response.user;
      
      // Persist tokens
      tokenService.setTokens(response.token, response.refreshToken);
      
      console.debug('Login successful', { userId: user.value?.id });
      
      return response;
    } catch (err) {
      error.value = err.message || 'Login failed';
      console.debug('Login failed', { error: err.message });
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (userData) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.debug('Attempting registration', { email: userData.email });
      
      const response = await authService.register(userData);
      
      // Store tokens and user data
      token.value = response.token;
      refreshToken.value = response.refreshToken;
      user.value = response.user;
      
      // Persist tokens
      tokenService.setTokens(response.token, response.refreshToken);
      
      console.debug('Registration successful', { userId: user.value?.id });
      
      return response;
    } catch (err) {
      error.value = err.message || 'Registration failed';
      console.debug('Registration failed', { error: err.message });
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      console.debug('Logging out user');
      
      // Call logout API if token exists
      if (token.value) {
        await authService.logout();
      }
    } catch (err) {
      console.debug('Logout API call failed', { error: err.message });
      // Continue with local logout even if API fails
    } finally {
      // Clear local state
      user.value = null;
      token.value = null;
      refreshToken.value = null;
      error.value = null;
      
      // Clear persisted tokens
      tokenService.clearTokens();
      
      console.debug('Logout completed');
    }
  };

  const refreshTokens = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available');
      }
      
      console.debug('Refreshing tokens');
      
      const response = await authService.refreshToken(refreshToken.value);
      
      // Update tokens
      token.value = response.token;
      refreshToken.value = response.refreshToken;
      
      // Persist new tokens
      tokenService.setTokens(response.token, response.refreshToken);
      
      console.debug('Tokens refreshed successfully');
      
      return response;
    } catch (err) {
      console.debug('Token refresh failed', { error: err.message });
      // If refresh fails, logout user
      await logout();
      throw err;
    }
  };

  const initializeAuth = async () => {
    try {
      console.debug('Initializing authentication');
      
      // Get stored tokens
      const storedTokens = tokenService.getTokens();
      
      if (storedTokens?.token) {
        token.value = storedTokens.token;
        refreshToken.value = storedTokens.refreshToken;
        
        // Verify token and get user data
        const userData = await authService.getCurrentUser();
        user.value = userData;
        
        console.debug('Authentication initialized', { userId: user.value?.id });
      }
    } catch (err) {
      console.debug('Auth initialization failed', { error: err.message });
      // Clear invalid tokens
      await logout();
    }
  };

  const updateUser = (userData) => {
    if (user.value) {
      user.value = { ...user.value, ...userData };
      console.debug('User data updated', { userId: user.value.id });
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    user,
    token,
    refreshToken,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    userRole,
    userName,
    
    // Actions
    login,
    register,
    logout,
    refreshTokens,
    initializeAuth,
    updateUser,
    clearError
  };
});
