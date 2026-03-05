// src/services/cartService.js

import { logger } from '@/utils/logger';
import { api, ApiError } from '@/utils/apiClient';

/**
 * Backend Cart Service - Phase 7 SCOPE
 * 
 * ACTIVE METHODS (Phase 7):
 * - getCart() - Fetch backend cart (read-only)
 * - replaceCart() - REPLACE backend cart with guest cart on login
 * 
 * PHASE 7 SCOPE LIMITATIONS:
 * - Backend cart is READ-ONLY except during login replacement
 * - No per-item backend mutations (add/update/remove)
 * - CartContext orchestrates all cart operations locally
 * - Backend is source-of-truth for authenticated users, but not mutated per-action
 * 
 * PHASE 8+ (NOT YET IMPLEMENTED):
 * - Per-item backend cart mutations
 * - Real-time cart sync
 * - Multi-device cart sync
 * 
 * TODO: MERGE_STRATEGY - Implement smart cart merge for multi-device users
 * TODO: CART_CRUD - Enable per-item backend mutations in Phase 8+
 */

const isValidObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

// ============================================================================
// PHASE 7: ACTIVE METHODS (READ + REPLACE ONLY)
// ============================================================================

/**
 * Get user's cart from backend (READ-ONLY)
 * 
 * Called ONCE after login to hydrate CartContext state.
 * Not called per-action (Phase 7 limitation).
 * 
 * @param {string} accessToken - Access token
 * @returns {Promise<Object|null>} - Cart object with items, or null on error
 */
export const getCart = async (accessToken) => {
  
  try {
    return await api.authGet('/cart', accessToken);
  } catch (error) {
    logger.error('[CART_SERVICE] Fetch cart error:', error);
    return null;
  }
};

/**
 * REPLACE backend cart with guest cart (Phase 7: REPLACE Strategy)
 * 
 * Called ONCE on successful login to migrate guest cart to backend.
 * Strategy: Clear backend cart, then add all guest items.
 * 
 * LIMITATIONS:
 * - No merge with existing backend cart
 * - Existing backend cart is completely replaced
 * - Multi-device users lose cart from other devices
 * 
 * TODO: MERGE_STRATEGY - Implement smart merge instead of replace
 * 
 * @param {string} accessToken - Access token
 * @param {Array} guestItems - Guest cart items from localStorage
 * @returns {Promise<boolean>} - Success status
 */
export const replaceCart = async (accessToken, guestItems) => {
  
  try {
    // Step 1: Fetch current backend cart
    const backendCart = await getCart(accessToken);
    
    // Step 2: Clear backend cart if it has items
    if (backendCart && backendCart.items && backendCart.items.length > 0) {
      await _clearCartInternal(accessToken, backendCart.items);
    }
    
    // Step 3: Add all guest items to backend cart
    if (guestItems.length > 0) {
      
      for (const item of guestItems) {
        const rawProductId =
          item.product?._id ||
          item.product?.id ||
          item.productId ||
          null;

        const productId = String(rawProductId || '').trim();
        const quantity = Math.max(1, Number(item?.quantity || 1) || 1);

        if (!productId || !isValidObjectId(productId)) {
          logger.warn('[CART_SERVICE] Skipping item without productId:', item);
          continue;
        }

        try {
          await _addToCartInternal(accessToken, { productId, quantity });
        } catch (error) {
          logger.warn('[CART_SERVICE] Skipping guest item during migration:', {
            productId,
            message: error?.message || 'Failed to add item',
          });
        }
      }
    }
    return true;
  } catch (error) {
    logger.error('[CART_SERVICE] Replace cart error:', error);
    throw error;
  }
};

// ============================================================================
// PHASE 7: INTERNAL HELPERS (Used only by replaceCart)
// ============================================================================

/**
 * Internal: Add item to backend cart
 * ONLY used by replaceCart() during login migration
 */
async function _addToCartInternal(accessToken, { productId, quantity }) {
  
  try {
    return await api.authPost('/cart/items', { productId, quantity }, accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.data?.code === 'DUPLICATE_KEY') {
      const cart = await getCart(accessToken);
      if (cart) {
        const targetId = String(productId);
        const containsTarget = Array.isArray(cart.items) && cart.items.some((item) => {
          const existingId =
            item?.product?._id ||
            item?.product?.id ||
            item?.productId?._id ||
            item?.productId?.id ||
            item?.productId ||
            null;
          return existingId ? String(existingId) === targetId : false;
        });

        if (containsTarget) {
          return cart;
        }
      }
      throw new Error('Cart conflict: backend rejected this item. Please refresh and try again.');
    }
    throw new Error(error?.message || 'Failed to add item to cart');
  }
}

/**
 * Internal: Remove item from backend cart
 * ONLY used by _clearCartInternal() during login migration
 */
async function _removeFromCartInternal(accessToken, itemId) {
  if (!itemId || typeof itemId !== 'string' || !isValidObjectId(itemId)) {
    throw new Error('Invalid cart item identifier');
  }
  return await api.authDelete(`/cart/items/${itemId}`, accessToken);
}

/**
 * Internal: Clear entire backend cart
 * ONLY used by replaceCart() during login migration
 */
async function _clearCartInternal(accessToken, items) {
  
  // Skip if no items or items don't have valid IDs
  if (!items || items.length === 0) {
    return;
  }
  
  // Filter out items without valid MongoDB IDs
  const validItems = items.filter(item => {
    const id = item._id || item.id;
    return id && typeof id === 'string' && id.length === 24;
  });
  
  if (validItems.length === 0) {
    return;
  }
  
  const removePromises = validItems.map(item => 
    _removeFromCartInternal(accessToken, item._id || item.id)
  );
  
  await Promise.all(removePromises);
}

// ============================================================================
// PHASE 8: PER-ITEM BACKEND MUTATIONS (NOW ACTIVE)
// ============================================================================

/**
 * Add item to backend cart
 * @param {string} accessToken - Access token
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} - Updated cart data
 */
export const addToCart = async (accessToken, { productId, quantity }) => {
  return await _addToCartInternal(accessToken, { productId, quantity });
};

/**
 * Get cart summary with tax/shipping/coupon totals
 * @param {string} accessToken
 * @param {string|null} shippingAddressId
 */
export const getCartSummary = async (accessToken, shippingAddressId = null) => {
  try {
    return await api.authPost('/cart/summary', { shippingAddressId }, accessToken);
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    const status = error instanceof ApiError ? error.status : 0;
    const isEmptyCartResponse =
      [400, 404, 422].includes(status) &&
      (
        message.includes('cart is empty') ||
        message.includes('empty cart') ||
        message.includes('no items in cart') ||
        message.includes('cart not found')
      );

    if (isEmptyCartResponse) {
      return null;
    }

    throw new Error(error?.message || 'Failed to fetch cart summary');
  }
};

/**
 * Guest cart summary (no auth)
 */
export const getGuestCartSummary = async ({ items = [], shippingAddress = null, couponCode = null } = {}) => {
  return await api.post('/cart/summary/guest', { items, shippingAddress, couponCode });
};

/**
 * Apply coupon code to backend cart
 */
export const applyCoupon = async (accessToken, code) => {
  return await api.authPost('/cart/coupon', { code }, accessToken);
};

/**
 * Remove applied coupon from backend cart
 */
export const removeCoupon = async (accessToken) => {
  return await api.authDelete('/cart/coupon', accessToken);
};

/**
 * Update cart item quantity
 * @param {string} accessToken - Access token
 * @param {string} itemId - Cart item ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} - Updated cart item
 */
export const updateCartItem = async (accessToken, itemId, quantity) => {
  return await api.authPatch(`/cart/items/${itemId}`, { quantity }, accessToken);
};

/**
 * Remove item from backend cart
 * @param {string} accessToken - Access token
 * @param {string} itemId - Cart item ID
 * @returns {Promise<Object>} - Result
 */
export const removeFromCart = async (accessToken, itemId) => {
  return await _removeFromCartInternal(accessToken, itemId);
};

/**
 * Clear entire backend cart
 * @param {string} accessToken - Access token
 * @param {Array} items - Cart items to clear
 * @returns {Promise<void>}
 */
export const clearCart = async (accessToken, items) => {
  return await _clearCartInternal(accessToken, items);
};


