/**
 * API Service Module
 * Comprehensive HTTP client using Axios with interceptors and error handling
 */
import axios from 'axios';
import { appConfig } from '@/config/app.config';
import { tokenService } from './token.service';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: appConfig.api.baseUrl,
  timeout: appConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!token
    });
    
    return config;
  },
  (error) => {
    console.debug('Request interceptor error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.debug('API Response', {
      status: response.status,
      url: response.config.url
    });
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.debug('API Response Error', {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.message
    });
    
    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const authStore = useAuthStore();
        await authStore.refreshTokens();
        
        // Retry original request with new token
        const newToken = tokenService.getToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.debug('Token refresh failed', { error: refreshError.message });
        // Redirect to login will be handled by auth store
      }
    }
    
    // Handle other errors
    const appStore = useAppStore();
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    
    // Show error notification for non-auth errors
    if (error.response?.status !== 401) {
      appStore.showError(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

/**
 * API Service Class
 * Provides methods for common HTTP operations
 */
class ApiService {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Axios config
   * @returns {Promise} - Response data
   */
  async get(endpoint, config = {}) {
    try {
      const response = await apiClient.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} - Response data
   */
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await apiClient.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} - Response data
   */
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await apiClient.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} - Response data
   */
  async patch(endpoint, data = {}, config = {}) {
    try {
      const response = await apiClient.patch(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Axios config
   * @returns {Promise} - Response data
   */
  async delete(endpoint, config = {}) {
    try {
      const response = await apiClient.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error
   * @returns {Error} - Formatted error
   */
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;
    const code = error.response?.data?.code || error.code;
    
    const formattedError = new Error(message);
    formattedError.status = status;
    formattedError.code = code;
    formattedError.originalError = error;
    
    return formattedError;
  }

  /**
   * Set default headers
   * @param {Object} headers - Headers to set
   */
  setHeaders(headers) {
    Object.assign(apiClient.defaults.headers, headers);
  }

  /**
   * Get axios instance for advanced usage
   * @returns {AxiosInstance} - Axios instance
   */
  getInstance() {
    return apiClient;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export individual methods for convenience
export const { get, post, put, patch, delete: del } = apiService;

// Legacy exports for backward compatibility
export const fetchData = (endpoint, options = {}) => {
  return apiService.get(endpoint, options);
};

export const postData = (endpoint, data, options = {}) => {
  return apiService.post(endpoint, data, options);
};

export default apiService;
