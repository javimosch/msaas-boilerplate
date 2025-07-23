/**
 * Token Service
 * Manages JWT tokens in localStorage with security best practices
 */
import { appConfig } from '@/config/app.config';

class TokenService {
  constructor() {
    this.tokenKey = appConfig.auth.tokenKey;
    this.refreshTokenKey = appConfig.auth.refreshTokenKey;
  }

  /**
   * Get access token from localStorage
   * @returns {string|null} - Access token or null
   */
  getToken() {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.debug('Error getting token from localStorage', { error: error.message });
      return null;
    }
  }

  /**
   * Get refresh token from localStorage
   * @returns {string|null} - Refresh token or null
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(this.refreshTokenKey);
    } catch (error) {
      console.debug('Error getting refresh token from localStorage', { error: error.message });
      return null;
    }
  }

  /**
   * Get both tokens
   * @returns {Object} - Object with token and refreshToken
   */
  getTokens() {
    return {
      token: this.getToken(),
      refreshToken: this.getRefreshToken()
    };
  }

  /**
   * Set access token in localStorage
   * @param {string} token - Access token
   */
  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(this.tokenKey, token);
        console.debug('Token stored successfully');
      }
    } catch (error) {
      console.debug('Error storing token in localStorage', { error: error.message });
    }
  }

  /**
   * Set refresh token in localStorage
   * @param {string} refreshToken - Refresh token
   */
  setRefreshToken(refreshToken) {
    try {
      if (refreshToken) {
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        console.debug('Refresh token stored successfully');
      }
    } catch (error) {
      console.debug('Error storing refresh token in localStorage', { error: error.message });
    }
  }

  /**
   * Set both tokens
   * @param {string} token - Access token
   * @param {string} refreshToken - Refresh token
   */
  setTokens(token, refreshToken) {
    this.setToken(token);
    this.setRefreshToken(refreshToken);
  }

  /**
   * Remove access token from localStorage
   */
  clearToken() {
    try {
      localStorage.removeItem(this.tokenKey);
      console.debug('Token cleared successfully');
    } catch (error) {
      console.debug('Error clearing token from localStorage', { error: error.message });
    }
  }

  /**
   * Remove refresh token from localStorage
   */
  clearRefreshToken() {
    try {
      localStorage.removeItem(this.refreshTokenKey);
      console.debug('Refresh token cleared successfully');
    } catch (error) {
      console.debug('Error clearing refresh token from localStorage', { error: error.message });
    }
  }

  /**
   * Clear both tokens
   */
  clearTokens() {
    this.clearToken();
    this.clearRefreshToken();
  }

  /**
   * Check if token exists and is not expired
   * @returns {boolean} - True if token is valid
   */
  isTokenValid() {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    try {
      // Decode JWT payload (basic check, not cryptographically verified)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.debug('Token expired', { exp: payload.exp, current: currentTime });
        return false;
      }
      
      return true;
    } catch (error) {
      console.debug('Error validating token', { error: error.message });
      return false;
    }
  }

  /**
   * Check if token needs refresh (within refresh threshold)
   * @returns {boolean} - True if token should be refreshed
   */
  shouldRefreshToken() {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const refreshThreshold = appConfig.auth.refreshThreshold / 1000; // Convert to seconds
      
      // Check if token expires within refresh threshold
      if (payload.exp && (payload.exp - currentTime) < refreshThreshold) {
        console.debug('Token should be refreshed', { 
          exp: payload.exp, 
          current: currentTime,
          threshold: refreshThreshold 
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.debug('Error checking token refresh need', { error: error.message });
      return false;
    }
  }

  /**
   * Get token payload (decoded but not verified)
   * @returns {Object|null} - Token payload or null
   */
  getTokenPayload() {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.debug('Error decoding token payload', { error: error.message });
      return null;
    }
  }

  /**
   * Get user ID from token
   * @returns {string|null} - User ID or null
   */
  getUserIdFromToken() {
    const payload = this.getTokenPayload();
    return payload?.userId || payload?.sub || null;
  }

  /**
   * Get user role from token
   * @returns {string|null} - User role or null
   */
  getUserRoleFromToken() {
    const payload = this.getTokenPayload();
    return payload?.role || null;
  }
}

// Create and export singleton instance
export const tokenService = new TokenService();

export default tokenService;
