import { api } from '@/utils/apiClient';
import { logger } from '@/utils/logger';

/**
 * Authentication Service
 *
 * Cookie-first auth flow with optional bearer fallback support.
 */

export const login = async (email, password) => {
  try {
    return await api.post('/auth/login', { identifier: email, password });
  } catch (error) {
    logger.error('[AUTH_SERVICE] Login error:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    return await api.post('/auth/register', userData);
  } catch (error) {
    logger.error('[AUTH_SERVICE] Registration error:', error);
    throw error;
  }
};

export const logout = async (accessToken, refreshToken) => {
  try {
    await api.authPost('/auth/logout', refreshToken ? { refreshToken } : {}, accessToken || null);
  } catch (error) {
    logger.warn('[AUTH_SERVICE] Logout error (continuing anyway):', error);
  }
};

export const getCurrentUser = async (accessToken) => {
  try {
    return await api.authGet('/users/me', accessToken || null);
  } catch (error) {
    logger.error('[AUTH_SERVICE] Get user error:', error);
    return null;
  }
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    return await api.post('/auth/refresh', refreshToken ? { refreshToken } : {});
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    const isMissingRefreshToken =
      error?.status === 401 ||
      message.includes('missing refresh token') ||
      message.includes('refresh token');

    // Guests will naturally hit this path on bootstrap; treat as no-session.
    if (isMissingRefreshToken) {
      return null;
    }

    logger.error('[AUTH_SERVICE] Refresh token error:', error);
    throw error;
  }
};

export const googleLogin = async (idToken) => {
  try {
    return await api.post('/auth/google', { idToken });
  } catch (error) {
    logger.error('[AUTH_SERVICE] Google login error:', error);
    throw error;
  }
};
