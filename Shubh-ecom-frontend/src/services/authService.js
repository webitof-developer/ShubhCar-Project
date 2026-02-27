//src/services/authService.js

import APP_CONFIG from '@/config/app.config';

/**
 * Authentication Service
 * 
 * Handles all authentication operations with backend
 * - Login/Logout
 * - User profile fetch
 * - Token management (handled by AuthContext)
 */

const API_BASE = APP_CONFIG.api.baseUrl;
const readResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return { text: '', json: null };
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
};

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
export const login = async (email, password) => {
  console.log('[AUTH_SERVICE] Login attempt for:', email);
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier: email, password }), // Backend expects "identifier" field
    });

    const { text, json } = await readResponseBody(response);
    if (!response.ok) {
      console.error('[AUTH_SERVICE] Login failed:', {
        status: response.status,
        message: json?.message || text || null,
      });
      throw new Error(json?.message || text || 'Login failed');
    }
    console.log('[AUTH_SERVICE] Login successful - USING REAL BACKEND');
    
    // Backend returns { success, data: { accessToken, refreshToken, user }, message }
    return json?.data || json;
  } catch (error) {
    console.error('[AUTH_SERVICE] Login error:', error);
    throw error;
  }
};

/**
 * Register new user
 * @param {object} userData - User registration data
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
export const register = async (userData) => {
  console.log('[AUTH_SERVICE] Register attempt for:', userData.email);
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const { text, json } = await readResponseBody(response);
    if (!response.ok) {
      console.error('[AUTH_SERVICE] Registration failed:', {
        status: response.status,
        message: json?.message || text || null,
      });
      throw new Error(json?.message || text || 'Registration failed');
    }
    console.log('[AUTH_SERVICE] Registration successful - USING REAL BACKEND');
    
    return json?.data || json;
  } catch (error) {
    console.error('[AUTH_SERVICE] Registration error:', error);
    throw error;
  }
};

/**
 * Logout user (revoke session)
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
export const logout = async (accessToken, refreshToken) => {
  console.log('[AUTH_SERVICE] Logout attempt');
  
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.warn('[AUTH_SERVICE] Logout failed (continuing anyway)');
    } else {
      console.log('[AUTH_SERVICE] Logout successful');
    }
  } catch (error) {
    console.warn('[AUTH_SERVICE] Logout error (continuing anyway):', error);
  }
};

/**
 * Get current user profile
 * @param {string} accessToken - Access token
 * @returns {Promise<object|null>} User object or null
 */
export const getCurrentUser = async (accessToken) => {
  console.log('[AUTH_SERVICE] Fetching current user');
  
  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const { json } = await readResponseBody(response);
    if (!response.ok) {
      console.error('[AUTH_SERVICE] Failed to fetch user');
      return null;
    }
    console.log('[AUTH_SERVICE] User fetched successfully');
    
    return json?.data || json || null;
  } catch (error) {
    console.error('[AUTH_SERVICE] Get user error:', error);
    return null;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export const refreshAccessToken = async (refreshToken) => {
  console.log('[AUTH_SERVICE] Refreshing access token');
  
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const { text, json } = await readResponseBody(response);
    if (!response.ok) {
      console.error('[AUTH_SERVICE] Token refresh failed');
      throw new Error(json?.message || text || 'Token refresh failed');
    }
    console.log('[AUTH_SERVICE] Token refreshed successfully');
    
    return json?.data || json;
  } catch (error) {
    console.error('[AUTH_SERVICE] Refresh token error:', error);
    throw error;
  }
};
/**
 * Login with Google
 * @param {string} idToken - Google ID Token
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
export const googleLogin = async (idToken) => {
  console.log('[AUTH_SERVICE] Google login attempt');
  
  try {
    const response = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const { text, json } = await readResponseBody(response);
    if (!response.ok) {
      console.error('[AUTH_SERVICE] Google login failed:', {
        status: response.status,
        message: json?.message || text || null,
      });
      throw new Error(json?.message || text || 'Google login failed');
    }
    console.log('[AUTH_SERVICE] Google login successful - USING REAL BACKEND');
    
    // Backend returns { success, data: { accessToken, refreshToken, user }, message }
    return json?.data || json;
  } catch (error) {
    console.error('[AUTH_SERVICE] Google login error:', error);
    throw error;
  }
};
