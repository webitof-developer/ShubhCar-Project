
//src/context/WishlistContext.jsx

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as wishlistService from '@/services/wishlistService';
import { getProductById } from '@/services/productService';
import { resolveProductImages } from '@/utils/media';

const WishlistContext = createContext(undefined);
const normalizeWishlistEntries = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
};

export const WishlistProvider = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeProduct = useCallback((product) => {
    if (!product) return null;
    return {
      ...product,
      images: resolveProductImages(product.images || []),
    };
  }, []);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await wishlistService.getWishlist(accessToken);
      const entries = normalizeWishlistEntries(data);
      const normalized = [];
      for (const entry of entries) {
        if (entry?.product) {
          normalized.push(normalizeProduct(entry.product));
          continue;
        }
        if (entry?._id && entry?.name) {
          normalized.push(normalizeProduct(entry));
          continue;
        }
        const productId = entry?.productId || entry;
        if (!productId) continue;
        const product = await getProductById(productId, { silent: true });
        if (product) normalized.push(normalizeProduct(product));
      }
      setItems(normalized);
    } catch (error) {
      console.error('[WISHLIST_CONTEXT] Failed to load wishlist:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, normalizeProduct]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch updates state
    loadWishlist();
  }, [loadWishlist]);

  const addToWishlist = useCallback(async (product) => {
    const productId = product?._id || product?.id;
    if (!productId) return;
    if (!isAuthenticated || !accessToken) {
      setItems(prev => {
        const exists = prev.find(item => (item._id || item.id) === productId);
        if (exists) return prev;
        return [...prev, normalizeProduct(product)];
      });
      return;
    }

    try {
      const created = await wishlistService.addToWishlist(productId, accessToken);
      if (created?.product) {
        const next = normalizeProduct(created.product);
        setItems(prev => {
          const exists = prev.find(item => (item._id || item.id) === (next?._id || next?.id));
          return exists ? prev : [...prev, next];
        });
      } else {
        await loadWishlist();
      }
    } catch (error) {
      console.error('[WISHLIST_CONTEXT] Add failed:', error);
    }
  }, [accessToken, isAuthenticated, loadWishlist, normalizeProduct]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!productId) return;
    if (!isAuthenticated || !accessToken) {
      setItems(prev => prev.filter(item => (item._id || item.id) !== productId));
      return;
    }
    try {
      await wishlistService.removeFromWishlist(productId, accessToken);
      setItems(prev => prev.filter(item => (item._id || item.id) !== productId));
    } catch (error) {
      console.error('[WISHLIST_CONTEXT] Remove failed:', error);
    }
  }, [accessToken, isAuthenticated]);

  const isInWishlist = useCallback((productId) => {
    return items.some(item => (item._id || item.id) === productId);
  }, [items]);

  const clearWishlist = useCallback(async () => {
    if (isAuthenticated && accessToken) {
      try {
        await wishlistService.clearWishlist(accessToken);
      } catch (error) {
        console.error('[WISHLIST_CONTEXT] Clear failed:', error);
      }
    }
    setItems([]);
  }, [accessToken, isAuthenticated]);

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{
      items,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist,
      itemCount,
      loading,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
