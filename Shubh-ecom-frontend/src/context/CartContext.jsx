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
import { getProductById } from '@/services/productService';
import { calculateCartTotal } from '@/services/pricingService';
import { getMinimumOrderQuantity } from '@/services/userTypeService';
import { toast } from 'sonner';

const CartContext = createContext(undefined);

const CART_STORAGE_KEY = 'cart_items';
const COUPON_STORAGE_KEY = 'applied_coupon';
const isValidObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));
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
const resolveItemKey = (item) => {
  const key = item?.id || item?._id || resolveItemProductId(item);
  return key ? String(key) : null;
};
const normalizeStoredCart = (storedCart) => {
  if (!storedCart) return [];
  if (Array.isArray(storedCart)) return storedCart;
  if (typeof storedCart === 'string') {
    try {
      const parsed = JSON.parse(storedCart);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
const resolveMinQtyForUser = (product, user) => {
  return Math.max(1, Number(getMinimumOrderQuantity(product, user) || 1));
};
const normalizeGuestEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null;
  const productId =
    entry.productId ||
    entry?.product?._id ||
    entry?.product?.id ||
    null;
  const quantity = Math.max(1, Number(entry.quantity || 1) || 1);
  if (!productId) return null;
  return {
    productId: String(productId),
    quantity,
    addedAt: entry.addedAt || null,
    snapshot: entry.snapshot || entry.product || null,
  };
};
const buildGuestSnapshot = (product, fallbackId) => {
  if (!product || typeof product !== 'object') {
    return fallbackId ? { _id: fallbackId } : null;
  }
  const id = product._id || product.id || fallbackId || null;
  return {
    _id: id || undefined,
    id: id || undefined,
    slug: product.slug || null,
    name: product.name || null,
    images: Array.isArray(product.images) ? product.images.slice(0, 3) : [],
    productType: product.productType || null,
    manufacturerBrand: product.manufacturerBrand || null,
    vehicleBrand: product.vehicleBrand || null,
    stockQty: Number(product.stockQty || 0),
    ratingAvg: Number(product.ratingAvg || 0),
    ratingCount: Number(product.ratingCount || 0),
    minOrderQty: Number(product.minOrderQty || 1),
    minWholesaleQty: Number(product.minWholesaleQty || 1),
    retailPrice: product.retailPrice || null,
    wholesalePrice: product.wholesalePrice || null,
    vendor: product.vendor || null,
    categorySlug: product.categorySlug || null,
    categoryName: product.categoryName || null,
  };
};
const toGuestStorageItems = (cartItems = []) =>
  cartItems
    .map((item) => {
      const productId = resolveItemProductId(item);
      return normalizeGuestEntry({
        productId,
        quantity: item?.quantity,
        addedAt: item?.addedAt || null,
        snapshot: buildGuestSnapshot(item?.product, productId),
      });
    })
    .filter(Boolean);

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
  const syncWithBackend = useCallback((backendCart) => {
    if (!backendCart) return;

    // Sync Items
    if (backendCart.items) {
      setItems(prevItems => {
        // Create a map of existing products to preserve details if backend only sends IDs
        const existingProductsMap = new Map();
        prevItems.forEach(item => {
          if (item.product && (item.product._id || item.product.id)) {
            existingProductsMap.set(String(item.product._id || item.product.id), item.product);
          }
        });

        const usedRowIds = new Set();
        const mappedBackendItems = backendCart.items.map((item, index) => {
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

          const fallbackProductId =
            resolveItemProductId({ product, productId: item.productId }) || 'item';
          const rawBackendItemId = item._id || item.id || null;
          const backendItemId = isValidObjectId(rawBackendItemId)
            ? String(rawBackendItemId)
            : null;
          const stableId =
            backendItemId ||
            `${fallbackProductId}-${index}`;
          let rowId = String(stableId);
          if (usedRowIds.has(rowId)) {
            rowId = `${rowId}-row-${index}`;
          }
          usedRowIds.add(rowId);

          return {
            id: rowId,
            backendItemId,
            productId: fallbackProductId,
            product: product,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice ?? item.price ?? item.productPrice ?? 0) || 0,
            lineTotal: Number(item.lineTotal ?? item.total ?? item.subtotal ?? 0) || 0,
          };
        });
        return mappedBackendItems;
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
    // console.error('[CART_CONTEXT] Synced with backend');
  }, []);

  /* ... useEffects ... */

  /**
   * Load guest cart from localStorage
   */
  const loadGuestCart = useCallback(async () => {
    try {
      const storedCart = getStorageItem(CART_STORAGE_KEY);
      const parsedCart = normalizeStoredCart(storedCart)
        .map(normalizeGuestEntry)
        .filter(Boolean);

      if (!parsedCart.length) {
        setItems([]);
        return;
      }

      const products = await Promise.all(
        parsedCart.map((entry) =>
          getProductById(entry.productId, { silent: true }).catch(() => null),
        ),
      );

      const hydratedItems = parsedCart
        .map((entry, index) => {
          const product = products[index] || entry.snapshot;
          if (!product) return null;
          return {
            id: `${entry.productId}-guest`,
            product,
            quantity: entry.quantity,
            addedAt: entry.addedAt || null,
          };
        })
        .filter(Boolean);

      setItems(hydratedItems);
      // Keep storage normalized but never trimmed by temporary fetch failures.
      setStorageItem(CART_STORAGE_KEY, parsedCart);
    } catch (error) {
      console.error('[CART_CONTEXT] Failed to load guest cart:', error);
      setItems([]);
    }
  }, []);

  /**
   * Persist cart snapshot to storage.
   * We persist for both guest/backend modes so UI cart doesn't disappear
   * on refresh when backend cart is temporarily empty or unavailable.
   */
  const persistGuestCart = useCallback((cartItems) => {
    if (cartSource !== 'guest') return;
    try {
      const payload = toGuestStorageItems(cartItems);
      setStorageItem(CART_STORAGE_KEY, payload);
    } catch (error) {
      console.error('[CART_CONTEXT] Failed to persist guest cart:', error);
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
              const backendItems = Array.isArray(backendCart?.items) ? backendCart.items : [];
              if (backendCart && backendItems.length > 0) {
                syncWithBackend(backendCart);
              } else if (backendCart) {
                setItems([]);
                setBackendDiscount(0);
              } else {
                // Keep current in-memory cart on transient fetch failures.
                console.warn('[CART_CONTEXT] Backend cart unavailable, preserving current cart state');
              }
            }
          } catch (error) {
            console.error('[CART_CONTEXT] Failed to load backend cart:', error);
            // toast.error('Failed to load your cart. Please refresh the page.'); // Optional: Don't spam

            // Do not fallback to guest for authenticated users, otherwise
            // backend cart can appear to "auto-remove" due source switching.
            if (isMounted) {
              setCartSource('backend');
            }
          }
        } else {
          // Guest: Load from localStorage
          if (isMounted) {
            setCartSource('guest');
            await loadGuestCart();
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
  }, [isAuthenticated, accessToken, authLoading, syncWithBackend, loadGuestCart]);

  /**
   * Public method: Hydrate cart from backend
   * Called by AuthContext after login cart migration
   */
  const hydrateFromBackend = useCallback(async () => {
    if (!accessToken) return;
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
    if (authLoading) {
      toast.info('Please wait, restoring your session...');
      return false;
    }

    const productId = product?._id || product?.id;
    if (!productId) {
      console.error('[CART_CONTEXT] Missing product id');
      return false;
    }
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const minQty = resolveMinQtyForUser(product, user);
    const normalizedQuantity = Math.max(minQty, safeQuantity);
    if (normalizedQuantity !== safeQuantity) {
      toast.info(`Minimum order quantity is ${minQty}. Quantity adjusted.`);
    }

    const isRealProduct = productId && String(productId).length === 24;
    if (cartSource === 'backend' && accessToken && !isRealProduct) {
      toast.error('This item cannot be added right now. Please refresh products and try again.');
      return false;
    }

    if (cartSource === 'backend' && accessToken && isRealProduct) {
      try {
        // Backend-first flow: avoid optimistic local rows that can disappear on sync.
        await cartService.addToCart(accessToken, {
          productId,
          quantity: normalizedQuantity,
        });

        // FETCH FRESH CART to ensure full consistency (avoid partial response issues)
        const fullCart = await cartService.getCart(accessToken);
        if (fullCart) {
          const targetId = String(productId);
          const containsTarget = Array.isArray(fullCart.items) && fullCart.items.some((item) => {
            const existingId =
              item?.product?._id ||
              item?.product?.id ||
              item?.productId?._id ||
              item?.productId?.id ||
              item?.productId ||
              null;
            return existingId ? String(existingId) === targetId : false;
          });

          if (!containsTarget) {
            toast.error('Item was not added due to backend cart conflict. Please try again.');
            return false;
          }

          syncWithBackend(fullCart);
          return true;
        }
        toast.error('Cart sync failed. Please refresh.');
        return false;

      } catch (error) {
        console.error('[CART_CONTEXT] Failed to add to backend cart:', error);
        toast.error(error?.message || 'Failed to add item to cart');
        return false;
      }
    }

    // Guest flow: optimistic local add + local persistence
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
          quantity: updated[existingIndex].quantity + normalizedQuantity,
        };
      } else {
        updated = [...prev, {
          id: `${productId}-${Date.now()}`,
          backendItemId: null,
          product,
          quantity: normalizedQuantity,
        }];
      }

      persistGuestCart(updated);
      return updated;
    });
    return true;
  }, [persistGuestCart, cartSource, accessToken, syncWithBackend, user, authLoading]);

  /**
   * UI-facing API: Remove from cart
   */
  const removeFromCart = useCallback(async (itemId) => {
    if (itemId === null || itemId === undefined || itemId === '') {
      console.warn('[CART_CONTEXT] removeFromCart called without valid item id');
      return;
    }
    const targetId = String(itemId);
    let backendItemId = null;

    setItems(prev => {
      // Find the first matched row only (avoid removing multiple rows if IDs collide).
      const removeIndex = prev.findIndex(i => resolveItemKey(i) === targetId);
      const item = removeIndex >= 0 ? prev[removeIndex] : null;
      if (item && cartSource === 'backend') {
        const candidate =
          item?.backendItemId ||
          item?._id ||
          (isValidObjectId(item?.id) ? item.id : null);
        backendItemId = isValidObjectId(candidate)
          ? String(candidate)
          : null;
      }

      if (removeIndex < 0) {
        return prev;
      }

      if (cartSource === 'backend' && accessToken && !backendItemId) {
        console.warn('[CART_CONTEXT] Skip local remove in backend mode: missing backend item id');
        return prev;
      }

      const updated = [
        ...prev.slice(0, removeIndex),
        ...prev.slice(removeIndex + 1),
      ];
      persistGuestCart(updated);

      return updated;
    });

    // Phase 8: Call backend for authenticated users
    if (cartSource === 'backend' && accessToken && backendItemId) {
      try {
        await cartService.removeFromCart(accessToken, backendItemId);

        // Always refetch full cart to avoid relying on partial mutation responses.
        const fullCart = await cartService.getCart(accessToken);
        if (fullCart) {
          syncWithBackend(fullCart);
        }

      } catch (error) {
        console.error('[CART_CONTEXT] Failed to remove from backend cart:', error);
        toast.error('Failed to sync cart. Changes saved locally.');
      }
    } else {
      if (cartSource === 'backend' && accessToken) {
        console.warn('[CART_CONTEXT] Skipped backend remove: missing valid backend item id');
      } else {
      }
    }
  }, [persistGuestCart, cartSource, accessToken, syncWithBackend]);

  /**
   * UI-facing API: Update quantity
   */
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1 || itemId === undefined || itemId === null || itemId === '') return;
    const targetId = String(itemId);
    let backendItemId = null;
    let enforcedQuantity = quantity;

    setItems(prev => {
      const updateIndex = prev.findIndex(i => resolveItemKey(i) === targetId);
      const item = updateIndex >= 0 ? prev[updateIndex] : null;
      if (cartSource === 'backend') {
        const candidate =
          item?.backendItemId ||
          item?._id ||
          (isValidObjectId(item?.id) ? item.id : null);
        backendItemId = isValidObjectId(candidate)
          ? String(candidate)
          : null;
      }
      const minQty = resolveMinQtyForUser(item?.product, user);
      enforcedQuantity = Math.max(minQty, quantity);

      if (updateIndex < 0) {
        return prev;
      }

      if (cartSource === 'backend' && accessToken && !backendItemId) {
        console.warn('[CART_CONTEXT] Skip local quantity update in backend mode: missing backend item id');
        return prev;
      }

      const updated = prev.map((entry, index) =>
        index === updateIndex ? { ...entry, quantity: enforcedQuantity } : entry
      );
      persistGuestCart(updated);

      return updated;
    });

    // Phase 8: Call backend for authenticated users
    if (cartSource === 'backend' && accessToken && backendItemId) {
      try {
        await cartService.updateCartItem(accessToken, backendItemId, enforcedQuantity);

        // Always refetch full cart to avoid relying on partial mutation responses.
        const fullCart = await cartService.getCart(accessToken);
        if (fullCart) {
          syncWithBackend(fullCart);
        }

      } catch (error) {
        console.error('[CART_CONTEXT] Failed to update backend cart:', error);
        toast.error('Failed to sync cart. Changes saved locally.');
      }
    } else {
      if (cartSource === 'backend' && accessToken) {
        console.warn('[CART_CONTEXT] Skipped backend quantity update: missing valid backend item id');
      } else {
      }
    }
  }, [persistGuestCart, cartSource, accessToken, syncWithBackend, user]);

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

