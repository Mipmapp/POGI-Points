/**
 * Token and Authentication Error Handler
 * Detects token-related errors and triggers automatic logout
 */

// Store callback function for logout to be set by the component
let onTokenExpiredCallback = null

export function setTokenExpiredCallback(callback) {
  onTokenExpiredCallback = callback
}

/**
 * Check if an error response is token-related
 * @param {Response} response - Fetch response object
 * @param {object} data - Parsed JSON response data
 * @returns {boolean} - True if token is expired/invalid
 */
export function isTokenError(response, data) {
  // Check for 401 Unauthorized
  if (response.status === 401) {
    return true
  }
  
  // Check for 400 Bad Request with token-related message
  if (response.status === 400) {
    const message = data?.message || ''
    if (message.toLowerCase().includes('token') || 
        message.toLowerCase().includes('invalid') ||
        message.toLowerCase().includes('expired')) {
      return true
    }
  }
  
  return false
}

/**
 * Handle token-related API responses
 * If token error detected, automatically logs out the user
 * @param {Response} response - Fetch response object
 * @param {object} data - Parsed JSON response data
 * @returns {boolean} - True if it was a token error and logout was triggered
 */
export function handleTokenError(response, data) {
  if (isTokenError(response, data)) {
    console.warn('[Token Handler] Token error detected, triggering automatic logout')
    
    // Clear token from storage
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    
    // Call the logout callback if set
    if (onTokenExpiredCallback) {
      onTokenExpiredCallback()
    }
    
    return true
  }
  
  return false
}
