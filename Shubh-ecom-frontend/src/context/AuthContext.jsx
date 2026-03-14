//src/context/AuthContext.jsx

/**
 * Authentication Context - Phase 7: Cart Migration
 * 
 * PHASE 7 CART MIGRATION:
 * - On login/register: migrate guest cart to backend (REPLACE strategy)
 * - Call cartService.replaceCart() with guest cart items
 * - Clear localStorage cart after migration
 * - CartContext will auto-fetch backend cart
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/storage';
import * as authService from '@/services/authService';
import * as cartService from '@/services/cartService';
import { isTokenExpired } from '@/utils/jwt';
import { logger } from '@/utils/logger';

/**
 * Authentication Context
 * 
 * Manages authentication state across the app
 * - Persists tokens in localStorage
 * - Provides login/logout functions
 * - Exposes authentication status
 * 
 * HYBRID MODE:
 * - Public browsing works without auth
 * - Auth required only for checkout/orders
 */

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = ({
    user: nextUser,
    accessToken: nextAccessToken = null,
    refreshToken: nextRefreshToken = null,
  }) => {
    setUser(nextUser || null);
    setAccessToken(nextAccessToken || null);
    setRefreshToken(nextRefreshToken || null);

    if (nextUser) {
      setStorageItem('user', nextUser);
    } else {
      removeStorageItem('user');
    }
    // Cookie-only auth mode: never persist tokens in localStorage/sessionStorage.
    removeStorageItem('accessToken');
    removeStorageItem('refreshToken');
  };

  // Bootstrap auth state from HttpOnly cookies (via refresh endpoint).
  useEffect(() => {
    const loadAuthState = async () => {
      const storedUser = getStorageItem('user');
      // Cleanup any legacy token persistence from previous builds.
      removeStorageItem('accessToken');
      removeStorageItem('refreshToken');

      try {
        const refreshed = await authService.refreshAccessToken();
        const cookieUser = refreshed?.user
          || (refreshed?.accessToken
            ? await authService.getCurrentUser(refreshed.accessToken)
            : await authService.getCurrentUser(null));

        if (cookieUser) {
          persistSession({
            user: cookieUser,
            accessToken: refreshed?.accessToken || null,
            refreshToken: refreshed?.refreshToken || null,
          });
        } else {
          // Refresh/cookie session did not resolve to a real user: clear stale auth.
          removeStorageItem('user');
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
        }
      } catch (error) {
        // Refresh endpoint may fail in some hosted setups even when auth cookie is valid.
        const cookieUser = await authService.getCurrentUser(null);
        if (cookieUser) {
          persistSession({
            user: cookieUser,
            accessToken: null,
            refreshToken: null,
          });
        } else if (error?.status === 0 && storedUser) {
          // Keep last known user on transient network failure.
          persistSession({
            user: storedUser,
            accessToken: null,
            refreshToken: null,
          });
        } else {
          removeStorageItem('user');
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
        }
      }

      setLoading(false);
    };

    loadAuthState();
  }, []);

  /**
   * Login user with email and password
   * Phase 7: Migrate guest cart to backend after login
   */
  const login = async (email, password) => {
    try {
      const sessionData = await authService.login(email, password);
      const resolvedUser =
        sessionData?.user || (await authService.getCurrentUser(sessionData?.accessToken || null));
      if (!resolvedUser) {
        throw new Error('Login succeeded but user profile could not be loaded');
      }

      persistSession({
        user: resolvedUser,
        accessToken: sessionData?.accessToken || null,
        refreshToken: sessionData?.refreshToken || null,
      });

      // Phase 7: Migrate guest cart to backend (REPLACE strategy)
      if (sessionData?.accessToken) {
        await migrateGuestCartToBackend(sessionData.accessToken);
      }

      return resolvedUser;
    } catch (error) {
      logger.error('[AUTH_CONTEXT] Login failed:', error);
      throw error;
    }
  };

  /**
   * Register new user
   * Phase 7: Migrate guest cart to backend after registration
   */
  const register = async (userData) => {
    try {
      const sessionData = await authService.register(userData);
      const resolvedUser =
        sessionData?.user || (await authService.getCurrentUser(sessionData?.accessToken || null));
      if (!resolvedUser) {
        throw new Error('Registration succeeded but user profile could not be loaded');
      }

      persistSession({
        user: resolvedUser,
        accessToken: sessionData?.accessToken || null,
        refreshToken: sessionData?.refreshToken || null,
      });

      // Phase 7: Migrate guest cart to backend (REPLACE strategy)
      if (sessionData?.accessToken) {
        await migrateGuestCartToBackend(sessionData.accessToken);
      }

      return resolvedUser;
    } catch (error) {
      logger.error('[AUTH_CONTEXT] Registration failed:', error);
      throw error;
    }
  };

  /**
   * Helper: Migrate guest cart to backend
   * Phase 7: REPLACE strategy - overwrites backend cart with guest cart
   */
  const migrateGuestCartToBackend = async (token) => {
    try {
      // Read guest cart from localStorage
      const guestCartRaw = getStorageItem('cart_items');
      
      if (!guestCartRaw) {
        return;
      }

      const guestCart = Array.isArray(guestCartRaw) ? guestCartRaw : [];
      
      if (!guestCart || guestCart.length === 0) {
        removeStorageItem('cart_items');
        return;
      }

      // Call cartService.replaceCart (REPLACE strategy)
      await cartService.replaceCart(token, guestCart);

      // Clear localStorage cart after successful migration
      removeStorageItem('cart_items');

      // Note: CartContext will auto-fetch backend cart via useEffect
    } catch (error) {
      logger.error('[AUTH_CONTEXT] Cart migration failed:', error);
      // Don't block login on cart migration failure
      // User can manually add items to cart after login
    }
  };

  /**
   * Logout user
   * Phase 7: Cart reverts to guest mode automatically (CartContext handles this)
   */
  /**
   * Login with Google
   * Phase 7: Migrate guest cart to backend after login
   */
  const loginWithGoogle = async (idToken) => {
    try {
      const sessionData = await authService.googleLogin(idToken);
      const resolvedUser =
        sessionData?.user || (await authService.getCurrentUser(sessionData?.accessToken || null));
      if (!resolvedUser) {
        throw new Error('Google login succeeded but user profile could not be loaded');
      }

      persistSession({
        user: resolvedUser,
        accessToken: sessionData?.accessToken || null,
        refreshToken: sessionData?.refreshToken || null,
      });

      // Phase 7: Migrate guest cart to backend (REPLACE strategy)
      if (sessionData?.accessToken) {
        await migrateGuestCartToBackend(sessionData.accessToken);
      }

      return resolvedUser;
    } catch (error) {
      logger.error('[AUTH_CONTEXT] Google Login failed:', error);
      throw error;
    }
  };

  /**
   * Logout user
   * Phase 7: Cart reverts to guest mode automatically (CartContext handles this)
   */
  const logout = async () => {
    // 1. Clear State & LocalStorage FIRST (Stability Fix)
    const tokenToRevoke = accessToken;
    const refreshToRevoke = refreshToken;



    // Clear state
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    // Clear localStorage
    removeStorageItem('accessToken');
    removeStorageItem('refreshToken');
    removeStorageItem('user');
 try {
      // 2. Call backend logout (best effort) AFTER clearing local state
      if (tokenToRevoke && refreshToRevoke) {
        // Fix for 401: Don't call backend if token is already expired
        if (isTokenExpired(tokenToRevoke)) {
        } else {
          await authService.logout(tokenToRevoke, refreshToRevoke);
        }
      }
    } catch (error) {
      logger.warn('[AUTH_CONTEXT] Logout API call failed (ignored)');
    }
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = Boolean(user);

  /**
   * Get user display name
   */
  const getUserDisplayName = () => {
    if (!user) return null;
    return user.firstName || user.email || user.phone || 'User';
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    loading,
    login,
    register,
        loginWithGoogle,
    logout,
    getUserDisplayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

