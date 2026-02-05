//src/context/CartContext.jsx
"use client";

/**
 * CartContext - Phase 7: Cart Source Orchestration
 * 
 * CART SOURCE-OF-TRUTH RULES:
 * - Guest users → localStorage cart
 * - Authenticated users → backend cart (READ-ONLY after login)
 * 
 * PHASE 7 BEHAVIOR:
 * - Cart mutations happen LOCALLY (not synced to backend per-action)
 * - Backend cart is fetched ONCE after login
 * - On login: guest cart → backend cart (REPLACE strategy)
 * - Backend cart is READ-ONLY until Phase 8+
 * 
 * UI-FACING API (UNCHANGED):
 * - addToCart, removeFromCart, updateQuantity, clearCart
 * - items, itemCount, subtotal
 * 
 * TODO: PHASE 8 - Enable per-item backend cart mutations
 * TODO: CART_SYNC - Real-time cart sync with backend
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/storage';
import * as cartService from '@/services/cartService';
import { calculateCartTotal } from '@/services/pricingService';
import { toast } from 'sonner';

const CartContext = createContext(undefined);

const CART_STORAGE_KEY = 'cart_items';
const COUPON_STORAGE_KEY = 'applied_coupon';

export const CartProvider = ({ children }) => {
  const { isAuthenticated, accessToken, loading: authLoading, user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializationLoading, setInitializationLoading] = useState(true); // New state to track initial load
  const [cartSource, setCartSource] = useState('guest'); // 'guest' | 'backend'
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [backendDiscount, setBackendDiscount] = useState(0);

  /**
   * Helper: Sync state with backend cart data
   * Updates items, discount, and coupon state from server response
   */
  const syncWithBackend = useCallback((backendCart, options = {}) => {
    if (!backendCart) return;
    const { preserveMissingItems = false } = options;

    // Sync Items
    if (backendCart.items) {
      setItems(prevItems => {
        const resolveItemProductId = (item) => {
          const id =
            item?.product?._id ||
            item?.product?.id ||
            item?.productId?._id ||
            item?.productId?.id ||
            item?.productId ||
            null;
          return id ? String(id) : null;
        };

        // Create a map of existing products to preserve details if backend only sends IDs
        const existingProductsMap = new Map();
        prevItems.forEach(item => {
          if (item.product && (item.product._id || item.product.id)) {
            existingProductsMap.set(String(item.product._id || item.product.id), item.product);
          }
        });

        const mappedBackendItems = backendCart.items.map(item => {
          // Determine the product object
          let product = item.product || item.productId || null;

          // If product is just an ID (string), try to find the full object in our existing items
          if (typeof product === 'string') {
            const cached = existingProductsMap.get(String(product));
            if (cached) product = cached;
          } else if (product && (product._id || product.id)) {
            // If it's an object, check if we have a better one (with more fields) locally
            // This helps if backend returns a "light" product object
            const cached = existingProductsMap.get(String(product._id || product.id));
            if (cached && Object.keys(cached).length > Object.keys(product).length) {
              product = { ...cached, ...product };
            }
          }

          return {
            id: item._id || `${item.productId}-${Date.now()}`,
            product: product,
            quantity: item.quantity,
          };
        });

        if (!preserveMissingItems) {
          return mappedBackendItems;
        }

        const backendIds = new Set(
          mappedBackendItems.map(item => resolveItemProductId(item)).filter(Boolean)
        );
        const extras = prevItems.filter(item => {
          const id = resolveItemProductId(item);
          return id && !backendIds.has(String(id));
        });

        return [...mappedBackendItems, ...extras];
      });
    }

    // Sync Discount & Coupon
    setBackendDiscount(backendCart.discountAmount || 0);

    if (backendCart.couponCode) {
      setAppliedCoupon({
        code: backendCart.couponCode,
        isBackend: true
      });
    } else {
      setAppliedCoupon(null);
    }

    // Log sync for debugging
    // console.log('[CART_CONTEXT] Synced with backend');
  }, []);

  /* ... useEffects ... */

  /**
   * Load guest cart from localStorage
   */
  const loadGuestCart = () => {
    try {
      const storedCart = getStorageItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        setItems(parsedCart);
        console.log('[CART_CONTEXT] Guest cart loaded from localStorage:', parsedCart.length, 'items');
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('[CART_CONTEXT] Failed to load guest cart:', error);
      setItems([]);
    }
  };

  /**
   * Persist guest cart to localStorage
   * - Only for guest users
   * - Auth users don't persist to localStorage (backend is source)
   */
  const persistGuestCart = useCallback((cartItems) => {
    if (cartSource === 'guest') {
      try {
        setStorageItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        console.log('[CART_CONTEXT] Guest cart persisted to localStorage');
      } catch (error) {
        console.error('[CART_CONTEXT] Failed to persist guest cart:', error);
      }
    }
  }, [cartSource]);

  /**
   * Phase 7: Load cart based on auth state
   * - Guest → Load from localStorage
   * - Auth → Fetch from backend (once)
   */
  useEffect(() => {
    let isMounted = true;

    // Safety timeout to prevent indefinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && initializationLoading) {
        console.warn('[CART_CONTEXT] Initialization timed out - forcing loading completion');
        setInitializationLoading(false);
        setLoading(false);
      }
    }, 3000);

    const loadCart = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      try {
        if (isAuthenticated && accessToken) {
          // Authenticated: Fetch backend cart (READ-ONLY)
          console.log('[CART_CONTEXT] User authenticated - fetching backend cart');
          if (isMounted) {
            setLoading(true);
            setCartSource('backend');
          }

          try {
            // Add a timeout to the fetch itself
            const fetchPromise = cartService.getCart(accessToken);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Cart fetch timeout')), 5000)
            );

            const backendCart = await Promise.race([fetchPromise, timeoutPromise]);

            if (isMounted) {
              if (backendCart) {
                syncWithBackend(backendCart);
              } else {
                setItems([]);
                setBackendDiscount(0);
              }
            }
          } catch (error) {
            console.error('[CART_CONTEXT] Failed to load backend cart:', error);
            // toast.error('Failed to load your cart. Please refresh the page.'); // Optional: Don't spam

            // Fallback to guest cart on error
            if (isMounted) {
              setCartSource('guest');
              loadGuestCart();
            }
          }
        } else {
          // Guest: Load from localStorage
          console.log('[CART_CONTEXT] Guest mode - loading from localStorage');
          if (isMounted) {
            setCartSource('guest');
            loadGuestCart();
          }
        }
      } catch (err) {
        console.error('[CART_CONTEXT] Critical error in loadCart:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitializationLoading(false); // Done loading
        }
      }
    };

    loadCart();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [isAuthenticated, accessToken, authLoading, syncWithBackend]);

  /**
   * Public method: Hydrate cart from backend
   * Called by AuthContext after login cart migration
   */
  const hydrateFromBackend = useCallback(async () => {
    if (!accessToken) return;

    console.log('[CART_CONTEXT] Hydrating cart from backend after migration');
    setLoading(true);
    setCartSource('backend');

    try {
      const backendCart = await cartService.getCart(accessToken);
      if (backendCart) {
        syncWithBackend(backendCart);
      }
    } catch (error) {
      console.error('[CART_CONTEXT] Failed to hydrate cart:', error);
      toast.error('Failed to load your cart');
    } finally {
      setLoading(false);
    }
  }, [accessToken, syncWithBackend]);

  /**
   * UI-facing API: Add to cart
   * Phase 7: All mutations happen locally (not synced to backend)
   */
  const addToCart = useCallback(async (product, quantity = 1) => {
    const productId = product?._id || product?.id;
    if (!productId) {
      console.error('[CART_CONTEXT] Missing product id');
      return;
    }
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    // Optimistic update
    setItems(prev => {
      const resolveItemProductId = (item) => {
        const id =
          item?.product?._id ||
          item?.product?.id ||
          item?.productId?._id ||
          item?.productId?.id ||
          item?.productId ||
          null;
        return id ? String(id) : null;
      };
      const targetId = String(productId);

      const existingIndex = prev.findIndex(
        item => resolveItemProductId(item) === targetId
      );

      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + safeQuantity,
        };
      } else {
        updated = [...prev, {
          id: `${productId}-${Date.now()}`,
          product,
          quantity: safeQuantity,
        }];
      }

      // Persist for guest users
      persistGuestCart(updated);

      return updated;
    });

    // Phase 8: Call backend ONLY for real products with authenticated users
    const isRealProduct = productId && String(productId).length === 24;

    if (cartSource === 'backend' && accessToken && isRealProduct) {
      try {
        await cartService.addToCart(accessToken, {
          productId,
          quantity: safeQuantity,
        });

        // FETCH FRESH CART to ensure full consistency (avoid partial response issues)
        const fullCart = await cartService.getCart(accessToken);
        syncWithBackend(fullCart, { preserveMissingItems: true });

      } catch (error) {
        console.error('[CART_CONTEXT] Failed to add to backend cart:', error);
        toast.error('Failed to sync cart. Changes saved locally.');
      }
    } else {
      if (!isRealProduct && accessToken) {
        // console.log('[CART_CONTEXT] Skipping backend sync for demo product');
      }
    }
  }, [persistGuestCart, cartSource, accessToken, syncWithBackend]);

  /**
   * UI-facing API: Remove from cart
   */
  const removeFromCart = useCallback(async (itemId) => {
    let backendItemId = null;

    setItems(prev => {
      // Find the item to get its backend ID
      const item = prev.find(i => i.id === itemId);
      if (item && cartSource === 'backend') {
        backendItemId = item.id;
      }

      const updated = prev.filter(item => item.id !== itemId);
      persistGuestCart(updated);

      return updated;
    });

    // Phase 8: Call backend for authenticated users
    if (cartSource === 'backend' && accessToken && backendItemId) {
      try {
        const updatedCart = await cartService.removeFromCart(accessToken, backendItemId);
        console.log('[CART_CONTEXT] Item removed from backend cart');

        // SYNC
        syncWithBackend(updatedCart);

      } catch (error) {
        console.error('[CART_CONTEXT] Failed to remove from backend cart:', error);
        toast.error('Failed to sync cart. Changes saved locally.');
      }
    } else {
      console.log('[CART_CONTEXT] Item removed (guest - localStorage only)');
    }
  }, [persistGuestCart, cartSource, accessToken, syncWithBackend]);

  /**
   * UI-facing API: Update quantity
   */
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return;

    let backendItemId = null;

    setItems(prev => {
      // Find the item to get its backend ID
      const item = prev.find(i => i.id === itemId);
      if (item && cartSource === 'backend') {
        backendItemId = item.id;
      }

      const updated = prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      persistGuestCart(updated);

      return updated;
    });

    // Phase 8: Call backend for authenticated users
    if (cartSource === 'backend' && accessToken && backendItemId) {
      try {
        const updatedCart = await cartService.updateCartItem(accessToken, backendItemId, quantity);
        console.log('[CART_CONTEXT] Quantity updated in backend cart');

        // SYNC
        syncWithBackend(updatedCart);

      } catch (error) {
        console.error('[CART_CONTEXT] Failed to update backend cart:', error);
        toast.error('Failed to sync cart. Changes saved locally.');
      }
    } else {
      console.log('[CART_CONTEXT] Quantity updated (guest - localStorage only)');
    }
  }, [persistGuestCart, cartSource, accessToken, syncWithBackend]);

  /**
   * UI-facing API: Clear cart
   */
  const clearCart = useCallback(async () => {
    const currentItems = items;
    const hadCoupon = !!appliedCoupon; // Check if coupon was applied before clearing
    setItems([]);
    setBackendDiscount(0);
    setAppliedCoupon(null);

    if (cartSource === 'guest') {
      removeStorageItem(CART_STORAGE_KEY);
      removeStorageItem(COUPON_STORAGE_KEY);
      console.log('[CART_CONTEXT] Guest cart cleared');
    } else if (cartSource === 'backend' && accessToken) {
      // Phase 8: Call backend cart clear
      try {
        // Parallel execution: Clear items AND remove coupon
        const promises = [cartService.clearCart(accessToken, currentItems)];

        if (hadCoupon) {
          promises.push(
            cartService.removeCoupon(accessToken)
              .catch(err => console.warn('[CART_CONTEXT] Failed to clear backend coupon (non-critical):', err))
          );
        }

        await Promise.all(promises);
        console.log('[CART_CONTEXT] Backend cart cleared (items + coupon)');
      } catch (error) {
        console.error('[CART_CONTEXT] Failed to clear backend cart:', error);
        toast.error('Failed to sync cart. Changes saved locally.');
      }
    }
  }, [cartSource, accessToken, items, appliedCoupon]);

  // Computed values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateCartTotal(items, user);

  /**
   * Calculate discount based on applied coupon
   */
  const discount = cartSource === 'backend'
    ? backendDiscount
    : (appliedCoupon
      ? (appliedCoupon.type === 'percent'
        ? Math.round(subtotal * appliedCoupon.discount)
        : Math.min(appliedCoupon.discount, subtotal))
      : 0);

  /**
   * Apply a coupon to the cart
   */
  const applyCoupon = useCallback(async (coupon) => {
    if (cartSource === 'backend' && accessToken) {
      try {
        // For auth users, call backend
        const updatedCart = await cartService.applyCoupon(accessToken, coupon.code);
        syncWithBackend(updatedCart);
        toast.success(`Coupon ${coupon.code} applied!`);
      } catch (error) {
        console.error('[CART_CONTEXT] Failed to apply coupon:', error);
        toast.error(error.message || 'Failed to apply coupon');
      }
    } else {
      // For guest users, use local logic
      setAppliedCoupon(coupon);
      setStorageItem(COUPON_STORAGE_KEY, coupon);
      console.log('[CART_CONTEXT] Coupon applied (local):', coupon.code);
      toast.success(`Coupon ${coupon.code} applied!`);
    }
  }, [cartSource, accessToken, syncWithBackend]);

  /**
   * Remove the applied coupon
   */
  const removeCoupon = useCallback(async () => {
    if (cartSource === 'backend' && accessToken) {
      try {
        // For auth users, call backend
        const updatedCart = await cartService.removeCoupon(accessToken);
        syncWithBackend(updatedCart);
        toast.success('Coupon removed');
      } catch (error) {
        console.error('[CART_CONTEXT] Failed to remove coupon:', error);
        toast.error('Failed to remove coupon');
      }
    } else {
      setAppliedCoupon(null);
      removeStorageItem(COUPON_STORAGE_KEY);
      console.log('[CART_CONTEXT] Coupon removed (local)');
      toast.success('Coupon removed');
    }
  }, [cartSource, accessToken, syncWithBackend]);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      discount,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      loading,
      initializationLoading, // Exposed for loading states
      cartSource,
      hydrateFromBackend, // Exposed for AuthContext
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
