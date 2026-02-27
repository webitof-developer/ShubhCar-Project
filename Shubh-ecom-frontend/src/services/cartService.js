// src/services/cartService.js

import APP_CONFIG from '@/config/app.config';

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
  console.log('[CART_SERVICE] Fetching cart from backend (READ-ONLY)');
  
  try {
    const response = await fetch(`${API_BASE}/cart`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const { text, json } = await readResponseBody(response);

    if (!response.ok) {
      console.error('[CART_SERVICE] Failed to fetch cart', {
        status: response.status,
        statusText: response.statusText,
        message: json?.message || text || null,
      });
      return null;
    }
    const cart = json?.data || json || null;
    console.log('[CART_SERVICE] Cart fetched -', cart?.items?.length || 0, 'items');
    
    return cart; // Returns { items: [...], subtotal, etc. }
  } catch (error) {
    console.error('[CART_SERVICE] Fetch cart error:', error);
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
  console.log('[CART_SERVICE] REPLACE strategy - migrating', guestItems.length, 'guest items');
  
  try {
    // Step 1: Fetch current backend cart
    const backendCart = await getCart(accessToken);
    
    // Step 2: Clear backend cart if it has items
    if (backendCart && backendCart.items && backendCart.items.length > 0) {
      console.log('[CART_SERVICE] Clearing existing backend cart (REPLACE)');
      await _clearCartInternal(accessToken, backendCart.items);
    }
    
    // Step 3: Add all guest items to backend cart
    if (guestItems.length > 0) {
      console.log('[CART_SERVICE] Adding guest items to backend cart');
      
      for (const item of guestItems) {
        const productId =
          item.product?._id ||
          item.product?.id ||
          item.productId ||
          null;

        if (productId) {
          await _addToCartInternal(accessToken, { productId, quantity: item.quantity });
        } else {
          console.warn('[CART_SERVICE] Skipping item without productId:', item);
        }
      }
    }
    
    console.log('[CART_SERVICE] Cart replacement complete');
    return true;
  } catch (error) {
    console.error('[CART_SERVICE] Replace cart error:', error);
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
  console.log('[CART_SERVICE] [INTERNAL] Adding item:', productId);
  
  const response = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      quantity,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 409 && payload.code === 'DUPLICATE_KEY') {
      const cart = await getCart(accessToken);
      if (cart) {
        return cart;
      }
    }
    throw new Error(payload.message || 'Failed to add item to cart');
  }

  return payload.data ?? payload;
}

/**
 * Internal: Remove item from backend cart
 * ONLY used by _clearCartInternal() during login migration
 */
async function _removeFromCartInternal(accessToken, itemId) {
  if (!itemId || typeof itemId !== 'string') {
    throw new Error('Invalid cart item id: missing or non-string');
  }
  const response = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to remove item from cart');
  }

  return payload.data ?? payload;
}

/**
 * Internal: Clear entire backend cart
 * ONLY used by replaceCart() during login migration
 */
async function _clearCartInternal(accessToken, items) {
  console.log('[CART_SERVICE] [INTERNAL] Clearing cart -', items.length, 'items');
  
  // Skip if no items or items don't have valid IDs
  if (!items || items.length === 0) {
    console.log('[CART_SERVICE] [INTERNAL] No items to clear');
    return;
  }
  
  // Filter out items without valid MongoDB IDs
  const validItems = items.filter(item => {
    const id = item._id || item.id;
    return id && typeof id === 'string' && id.length === 24;
  });
  
  if (validItems.length === 0) {
    console.log('[CART_SERVICE] [INTERNAL] No valid items to clear from backend');
    return;
  }
  
  const removePromises = validItems.map(item => 
    _removeFromCartInternal(accessToken, item._id || item.id)
  );
  
  await Promise.all(removePromises);
  console.log('[CART_SERVICE] [INTERNAL] Cart cleared');
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
  const response = await fetch(`${API_BASE}/cart/summary`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shippingAddressId }),
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to fetch cart summary');
  }
  return json?.data || json || null;
};

/**
 * Guest cart summary (no auth)
 */
export const getGuestCartSummary = async ({ items = [], shippingAddress = null, couponCode = null } = {}) => {
  const response = await fetch(`${API_BASE}/cart/summary/guest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items, shippingAddress, couponCode }),
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to fetch cart summary');
  }
  return json?.data || json || null;
};

/**
 * Apply coupon code to backend cart
 */
export const applyCoupon = async (accessToken, code) => {
  const response = await fetch(`${API_BASE}/cart/coupon`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to apply coupon');
  }
  return json?.data || json || null;
};

/**
 * Remove applied coupon from backend cart
 */
export const removeCoupon = async (accessToken) => {
  const response = await fetch(`${API_BASE}/cart/coupon`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to remove coupon');
  }
  return json?.data || json || null;
};

/**
 * Update cart item quantity
 * @param {string} accessToken - Access token
 * @param {string} itemId - Cart item ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} - Updated cart item
 */
export const updateCartItem = async (accessToken, itemId, quantity) => {
  const response = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to update cart item');
  }
  return json?.data || json || null;
};

/**
 * Remove item from backend cart
 * @param {string} accessToken - Access token
 * @param {string} itemId - Cart item ID
 * @returns {Promise<Object>} - Result
 */
export const removeFromCart = async (accessToken, itemId) => {
  console.log('[CART_SERVICE] Removing item:', itemId);
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

