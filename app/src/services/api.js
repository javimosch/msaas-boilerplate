/**
 * API service module
 * Contains functions for making API requests
 */
import { getEnvVar } from '../utils/helpers';

// Get base API URL from environment variables
const API_BASE_URL = getEnvVar('VUE_APP_API_URL', 'http://localhost:3001');

// Debug log for API initialization
console.debug('Initializing API service with base URL', { API_BASE_URL });

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export const fetchData = async (endpoint, options = {}) => {
  console.debug('Fetching data from API', { endpoint, options });
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.debug('API fetch error', { endpoint, error: error.message });
    throw error;
  }
};

/**
 * Post data to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export const postData = async (endpoint, data, options = {}) => {
  console.debug('Posting data to API', { endpoint, data, options });
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify(data),
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.debug('API post error', { endpoint, error: error.message });
    throw error;
  }
};
