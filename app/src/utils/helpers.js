/**
 * Utility functions for the application
 */

/**
 * Gets a formatted date string
 * @param {Date} [date=new Date()] - Date to format
 * @returns {string} - Formatted date string
 */
export const getFormattedDate = (date = new Date()) => {
  // Debug the incoming parameter
  console.debug('getFormattedDate called with', { date });
  
  try {
    return date instanceof Date 
      ? date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Invalid Date';
  } catch (error) {
    console.debug('Error formatting date', { error });
    return 'Invalid Date';
  }
};

/**
 * Safely access nested object properties with optional chaining
 * @param {Object} obj - The object to access
 * @param {string} path - Path to the property (dot notation)
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} - The property value or default value
 */
export const getNestedValue = (obj, path, defaultValue = '') => {
  console.debug('getNestedValue called', { obj, path, defaultValue });
  
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    result = result?.[key];
    
    if (result === undefined || result === null) {
      console.debug('Property not found in path', { missingKey: key });
      return defaultValue;
    }
  }
  
  return result;
};

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable name
 * @param {string} fallback - Fallback value
 * @returns {string} - Environment variable value or fallback
 */
export const getEnvVar = (key, fallback = '') => {
  console.debug('Getting environment variable', { key, fallback });
  return import.meta?.[key] || fallback;
};

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  console.debug('Creating debounced function', { wait });
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
