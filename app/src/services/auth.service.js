/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
import { apiService } from './api';

class AuthService {
  /**
   * Login user with email and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} - Login response with user and tokens
   */
  async login(credentials) {
    console.debug('AuthService: Login attempt', { email: credentials.email });
    
    const response = await apiService.post('/api/auth/login', {
      email: credentials.email,
      password: credentials.password
    });
    
    console.debug('AuthService: Login successful', { userId: response.user?.id });
    return response;
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @returns {Promise<Object>} - Registration response with user and tokens
   */
  async register(userData) {
    console.debug('AuthService: Registration attempt', { email: userData.email });
    
    const response = await apiService.post('/api/auth/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    });
    
    console.debug('AuthService: Registration successful', { userId: response.user?.id });
    return response;
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    console.debug('AuthService: Logout attempt');
    
    try {
      await apiService.post('/api/auth/logout');
      console.debug('AuthService: Logout successful');
    } catch (error) {
      console.debug('AuthService: Logout API call failed', { error: error.message });
      // Don't throw error as local logout should still proceed
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New tokens
   */
  async refreshToken(refreshToken) {
    console.debug('AuthService: Token refresh attempt');
    
    const response = await apiService.post('/api/auth/refresh', {
      refreshToken
    });
    
    console.debug('AuthService: Token refresh successful');
    return response;
  }

  /**
   * Get current user data
   * @returns {Promise<Object>} - Current user data
   */
  async getCurrentUser() {
    console.debug('AuthService: Get current user');
    
    let response = await apiService.get('/api/user/profile');

    response = response.data.user;
    
    console.debug('AuthService: Current user retrieved', { userId: response._id, data: response });
    return response;
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Reset request response
   */
  async requestPasswordReset(email) {
    console.debug('AuthService: Password reset request', { email });
    
    const response = await apiService.post('/api/auth/forgot-password', {
      email
    });
    
    console.debug('AuthService: Password reset request sent');
    return response;
  }

  /**
   * Reset password with token
   * @param {Object} resetData - Reset data
   * @param {string} resetData.token - Reset token
   * @param {string} resetData.password - New password
   * @returns {Promise<Object>} - Reset response
   */
  async resetPassword(resetData) {
    console.debug('AuthService: Password reset attempt');
    
    const response = await apiService.post('/api/auth/reset-password', {
      token: resetData.token,
      password: resetData.password
    });
    
    console.debug('AuthService: Password reset successful');
    return response;
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} - Change response
   */
  async changePassword(passwordData) {
    console.debug('AuthService: Password change attempt');
    
    const response = await apiService.post('/api/auth/change-password', {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    
    console.debug('AuthService: Password change successful');
    return response;
  }

  /**
   * Verify email address
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} - Verification response
   */
  async verifyEmail(token) {
    console.debug('AuthService: Email verification attempt');
    
    const response = await apiService.post('/api/auth/verify-email', {
      token
    });
    
    console.debug('AuthService: Email verification successful');
    return response;
  }

  /**
   * Resend email verification
   * @returns {Promise<Object>} - Resend response
   */
  async resendEmailVerification() {
    console.debug('AuthService: Resend email verification');
    
    const response = await apiService.post('/api/auth/resend-verification');
    
    console.debug('AuthService: Email verification resent');
    return response;
  }
}

// Create and export singleton instance
export const authService = new AuthService();

export default authService;
