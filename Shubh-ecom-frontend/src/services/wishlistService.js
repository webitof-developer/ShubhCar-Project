//src/services/wishlistService.js

/**
 * Wishlist Service - PHASE 8
 * 
 * DATA SOURCE:
 * - Reads APP_CONFIG.dataSource.profile.wishlist via getDataSourceConfig()
 * - 'demo' = Use localStorage persistence
 * - 'real' = Fetch from backend API /users/wishlist
 * - Supports fallback modes: 'demo' | 'empty' | 'error'
 * 
 * NOTE: Real backend fetch logic is DORMANT until config is switched to 'real'.
 * Currently config is set to 'demo', so all backend calls are skipped.
 */

import APP_CONFIG, { getDataSourceConfig, logDataSource } from '@/config/app.config';
import { handleDataSourceFallback } from '@/utils/dataSourceFallback';
import { logger } from '@/utils/logger';
import { api } from '@/utils/apiClient';

const STORAGE_KEY = 'user_wishlist';

const normalizeWishlistArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
};

// ==================== PRIVATE HELPERS (Demo Mode) ====================

/**
 * Get wishlist from localStorage (demo mode)
 */
const getDemoWishlist = () => {
  if (typeof window === 'undefined') return [];
  
  const wishlist = localStorage.getItem(STORAGE_KEY);
  return wishlist ? JSON.parse(wishlist) : [];
};

/**
 * Save wishlist to localStorage (demo mode)
 */
const saveDemoWishlist = (wishlist) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
};

// ==================== BACKEND API HELPERS (Real Mode - DORMANT) ====================

/**
 * Fetch wishlist from backend API
 * @param {string} accessToken - Auth token
 * @returns {Promise<Array>} - Array of product IDs or product objects
 */
const fetchRealWishlist = async (accessToken) => {
  try {
    const payload = await api.authGet('/wishlist', accessToken || null);
    return normalizeWishlistArray(payload);
  } catch (error) {
    logger.error('[WISHLIST_SERVICE] Wishlist fetch error:', error);
    throw error;
  }
};

/**
 * Add product to wishlist via backend API
 */
const addToRealWishlist = async (accessToken, productId) => {
  try {
    return await api.authPost('/wishlist', { productId }, accessToken || null);
  } catch (error) {
    logger.error('[WISHLIST_SERVICE] Add to wishlist error:', error);
    throw error;
  }
};

/**
 * Remove product from wishlist via backend API
 */
const removeFromRealWishlist = async (accessToken, productId) => {
  try {
    return await api.authDelete(`/wishlist/${productId}`, accessToken || null);
  } catch (error) {
    logger.error('[WISHLIST_SERVICE] Remove from wishlist error:', error);
    throw error;
  }
};

/**
 * Clear entire wishlist via backend API
 */
const clearRealWishlist = async (accessToken) => {
  // TODO: Backend may not have DELETE /wishlist (clear all) endpoint
  // Verify backend route exists before using this function
  try {
    await api.authDelete('/wishlist', accessToken || null);
    return true;
  } catch (error) {
    logger.error('[WISHLIST_SERVICE] Clear wishlist error:', error);
    throw error;
  }
};

// ==================== PUBLIC API ====================

/**
 * Get user's wishlist
 * PHASE 8: Now supports both demo and real backend fetch
 * 
 * @param {string} accessToken - Auth token (required for real mode)
 * @returns {Promise<Array>} - Array of product IDs or product objects
 */
export const getWishlist = async (accessToken = null) => {
  const config = getDataSourceConfig('profile.wishlist');

  // Demo mode: return localStorage data
  if (config.source === 'demo') {
    logDataSource('PROFILE.WISHLIST', 'DEMO', 'backend call skipped');
    return getDemoWishlist();
  }

  // Real mode: Fetch from backend
  logDataSource('PROFILE.WISHLIST', 'REAL');
  try {
    const wishlist = await fetchRealWishlist(accessToken);
    return normalizeWishlistArray(wishlist);
  } catch (error) {
    return handleDataSourceFallback('PROFILE.WISHLIST', config.fallback, [], error);
  }
};

/**
 * Add product to wishlist
 * PHASE 8: Now supports both demo and real backend
 * 
 * @param {string} productId - Product ID to add
 * @param {string} accessToken - Auth token (required for real mode)
 * @returns {Promise<Array>} - Updated wishlist
 */
export const addToWishlist = async (productId, accessToken = null) => {
  const config = getDataSourceConfig('profile.wishlist');

  // Demo mode: localStorage
  if (config.source === 'demo') {
    logDataSource('PROFILE.WISHLIST', 'DEMO', 'add via localStorage');
    const wishlist = getDemoWishlist();
    
    // Avoid duplicates
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      saveDemoWishlist(wishlist);
    }
    
    return wishlist;
  }

  // Real mode: Backend API
  logDataSource('PROFILE.WISHLIST', 'REAL', 'adding to wishlist');
  try {
    return await addToRealWishlist(accessToken, productId);
  } catch (error) {
    return handleDataSourceFallback('PROFILE.WISHLIST', config.fallback, [], error);
  }
};

/**
 * Remove product from wishlist
 * PHASE 8: Now supports both demo and real backend
 * 
 * @param {string} productId - Product ID to remove
 * @param {string} accessToken - Auth token (required for real mode)
 * @returns {Promise<Array>} - Updated wishlist
 */
export const removeFromWishlist = async (productId, accessToken = null) => {
  const config = getDataSourceConfig('profile.wishlist');

  // Demo mode: localStorage
  if (config.source === 'demo') {
    logDataSource('PROFILE.WISHLIST', 'DEMO', 'remove via localStorage');
    const wishlist = getDemoWishlist();
    const filtered = wishlist.filter(id => id !== productId);
    saveDemoWishlist(filtered);
    return filtered;
  }

  // Real mode: Backend API
  logDataSource('PROFILE.WISHLIST', 'REAL', 'removing from wishlist');
  try {
    return await removeFromRealWishlist(accessToken, productId);
  } catch (error) {
    return handleDataSourceFallback('PROFILE.WISHLIST', config.fallback, [], error);
  }
};

/**
 * Check if product is in wishlist
 * 
 * @param {string} productId - Product ID to check
 * @param {string} accessToken - Auth token (required for real mode)
 * @returns {Promise<boolean>} - True if in wishlist
 */
export const isInWishlist = async (productId, accessToken = null) => {
  const wishlist = normalizeWishlistArray(await getWishlist(accessToken));
  
  // Handle both array of IDs and array of objects
  if (wishlist.length > 0 && typeof wishlist[0] === 'string') {
    return wishlist.includes(productId);
  }
  
  return wishlist.some(item => item.productId === productId || item.id === productId);
};

/**
 * Toggle product in wishlist
 * 
 * @param {string} productId - Product ID to toggle
 * @param {string} accessToken - Auth token (required for real mode)
 * @returns {Promise<boolean>} - True if added, false if removed
 */
export const toggleWishlist = async (productId, accessToken = null) => {
  const inWishlist = await isInWishlist(productId, accessToken);
  
  if (inWishlist) {
    await removeFromWishlist(productId, accessToken);
    return false;
  } else {
    await addToWishlist(productId, accessToken);
    return true;
  }
};

/**
 * Clear entire wishlist
 * PHASE 8: Now supports both demo and real backend
 * 
 * @param {string} accessToken - Auth token (required for real mode)
 * @returns {Promise<boolean>} - True if successful
 */
export const clearWishlist = async (accessToken = null) => {
  const config = getDataSourceConfig('profile.wishlist');

  // Demo mode: localStorage
  if (config.source === 'demo') {
    logDataSource('PROFILE.WISHLIST', 'DEMO', 'clear via localStorage');
    saveDemoWishlist([]);
    return true;
  }

  // Real mode: Backend API
  logDataSource('PROFILE.WISHLIST', 'REAL', 'clearing wishlist');
  try {
    await clearRealWishlist(accessToken);
    return true;
  } catch (error) {
    if (config.fallback === 'error') {
      throw error;
    }
    return false;
  }
};

/**
 * Get wishlist count
 * 
 * @param {string} accessToken - Auth token (required for real mode)
 * @returns {Promise<number>} - Number of items in wishlist
 */
export const getWishlistCount = async (accessToken = null) => {
  const wishlist = normalizeWishlistArray(await getWishlist(accessToken));
  return wishlist.length;
};
