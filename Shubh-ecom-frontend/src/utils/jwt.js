
/**
 * JWT Utilities
 * 
 * Helper functions for handling JSON Web Tokens on the frontend.
 * Pure JS implementation to avoid dependencies.
 */

/**
 * Decode a JWT token (without validation)
 * @param {string} token 
 * @returns {object|null} Decoded payload or null
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[JWT_UTILS] Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 * @param {string} token 
 * @returns {boolean} True if expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Date.now() / 1000;
  // Add 10 second buffer to be safe
  return payload.exp < (currentTime + 10);
};