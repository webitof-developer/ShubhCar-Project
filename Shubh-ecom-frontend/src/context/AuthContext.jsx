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

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      const storedToken = getStorageItem('accessToken');
      const storedRefreshToken = getStorageItem('refreshToken');
      const storedUser = getStorageItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setAccessToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(userData);
          console.log('[AUTH_CONTEXT] Restored session for:', userData.email || userData.phone);
        } catch (error) {
          console.error('[AUTH_CONTEXT] Failed to parse stored user:', error);
          // Clear corrupted data
          removeStorageItem('accessToken');
          removeStorageItem('refreshToken');
          removeStorageItem('user');
        }
      } else {
        console.log('[AUTH_CONTEXT] No stored session found - BROWSING IN DEMO MODE');
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
      const { accessToken, refreshToken, user } = await authService.login(email, password);

      // Update state
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);

      // Persist to localStorage
      setStorageItem('accessToken', accessToken);
      setStorageItem('refreshToken', refreshToken);
      setStorageItem('user', JSON.stringify(user));

      console.log('[AUTH_CONTEXT] Login successful - USING REAL BACKEND');
      console.log('[AUTH_CONTEXT] User:', user.email || user.phone);

      // Phase 7: Migrate guest cart to backend (REPLACE strategy)
      await migrateGuestCartToBackend(accessToken);

      return user;
    } catch (error) {
      console.error('[AUTH_CONTEXT] Login failed:', error);
      throw error;
    }
  };

  /**
   * Register new user
   * Phase 7: Migrate guest cart to backend after registration
   */
  const register = async (userData) => {
    try {
      const { accessToken, refreshToken, user } = await authService.register(userData);

      // Update state
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);

      // Persist to localStorage
      setStorageItem('accessToken', accessToken);
      setStorageItem('refreshToken', refreshToken);
      setStorageItem('user', JSON.stringify(user));

      console.log('[AUTH_CONTEXT] Registration successful - USING REAL BACKEND');
      console.log('[AUTH_CONTEXT] User:', user.email || user.phone);

      // Phase 7: Migrate guest cart to backend (REPLACE strategy)
      await migrateGuestCartToBackend(accessToken);

      return user;
    } catch (error) {
      console.error('[AUTH_CONTEXT] Registration failed:', error);
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
      const guestCartStr = getStorageItem('cart_items');
      
      if (!guestCartStr) {
        console.log('[AUTH_CONTEXT] No guest cart to migrate');
        return;
      }

      const guestCart = JSON.parse(guestCartStr);
      
      if (!guestCart || guestCart.length === 0) {
        console.log('[AUTH_CONTEXT] Guest cart is empty, skipping migration');
        removeStorageItem('cart_items');
        return;
      }

      console.log('[AUTH_CONTEXT] Migrating', guestCart.length, 'items to backend cart');

      // Call cartService.replaceCart (REPLACE strategy)
      await cartService.replaceCart(token, guestCart);

      // Clear localStorage cart after successful migration
      removeStorageItem('cart_items');
      console.log('[AUTH_CONTEXT] Cart migration complete - localStorage cleared');

      // Note: CartContext will auto-fetch backend cart via useEffect
    } catch (error) {
      console.error('[AUTH_CONTEXT] Cart migration failed:', error);
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
      const {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user,
      } = await authService.googleLogin(idToken);

      // Update state
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(user);

      // Persist to localStorage
      setStorageItem('accessToken', newAccessToken);
      setStorageItem('refreshToken', newRefreshToken);
      setStorageItem('user', JSON.stringify(user));

      console.log('[AUTH_CONTEXT] Google Login successful');
      console.log('[AUTH_CONTEXT] User:', user.email);

      // Phase 7: Migrate guest cart to backend (REPLACE strategy)
      await migrateGuestCartToBackend(newAccessToken);

      return user;
    } catch (error) {
      console.error('[AUTH_CONTEXT] Google Login failed:', error);
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

    console.log('[AUTH_CONTEXT] Logged out - BROWSING IN DEMO MODE');
 try {
      // 2. Call backend logout (best effort) AFTER clearing local state
      if (tokenToRevoke && refreshToRevoke) {
        // Fix for 401: Don't call backend if token is already expired
        if (isTokenExpired(tokenToRevoke)) {
          console.log('[AUTH_CONTEXT] Token expired, skipping backend logout (harmless)');
        } else {
          await authService.logout(tokenToRevoke, refreshToRevoke);
        }
      }
    } catch (error) {
      console.warn('[AUTH_CONTEXT] Logout API call failed (ignored)');
    }
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = Boolean(accessToken && user);

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
