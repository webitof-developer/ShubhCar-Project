// src/services/pricingService.js

import { isWholesaleUser, canViewWholesalePrices } from './userTypeService';

/**
 * Pricing Service - PHASE 10A UPDATED
 * 
 * CRITICAL: All pricing functions now accept user as parameter
 * Caller must pass user from useAuth() or AuthContext
 * 
 * This ensures pricing decisions are based on CURRENT auth state
 */

/**
 * Calculate savings percentage
 */
const calculateSavings = (product) => {
  if (!product.retailPrice || !product.wholesalePrice) return 0;
  
  const savings = product.retailPrice - product.wholesalePrice;
  return Math.round((savings / product.retailPrice) * 100);
};

/**
 * Get the correct price to display for given user
 * @param {Object} product - Product object
 * @param {Object|null} user - User object from AuthContext
 * @returns {Object} - { price, type, savingsPercent, originalPrice }
 */
export const getDisplayPrice = (product, user = null, quantity = 1, now = new Date()) => {
  if (!product) {
    return {
      price: 0,
      type: 'retail',
      savingsPercent: null,
      originalPrice: null
    };
  }

  const toNumberPrice = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizePriceField = (value) => {
    if (value == null) return { mrp: 0, salePrice: null };
    if (typeof value === 'number' || typeof value === 'string') {
      return { mrp: toNumberPrice(value), salePrice: null };
    }
    return {
      mrp: toNumberPrice(value?.mrp),
      salePrice: value?.salePrice == null ? null : toNumberPrice(value?.salePrice),
    };
  };

  const isFlashActive = (item, now = new Date()) => {
    if (!item?.isFlashDeal) return false;
    const start = item?.flashDealStartAt ? new Date(item.flashDealStartAt) : null;
    const end = item?.flashDealEndAt ? new Date(item.flashDealEndAt) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start <= now && now <= end;
  };

  const resolveTierPrice = (priceField, flashActive) => {
    const normalized = normalizePriceField(priceField);
    if (flashActive && normalized.salePrice != null && normalized.salePrice > 0) {
      return normalized.salePrice;
    }
    return normalized.mrp;
  };

  const safeQty = Math.max(1, Number(quantity || 1) || 1);
  const referenceNow = now instanceof Date ? now : new Date();
  const minWholesaleQty = Math.max(1, Number(product?.minWholesaleQty || 1) || 1);
  const wholesaleApproved = canViewWholesalePrices(user);
  const hasWholesalePrice = !!product?.wholesalePrice;
  const useWholesaleTier = wholesaleApproved && hasWholesalePrice && safeQty >= minWholesaleQty;
  const flashActive = isFlashActive(product, referenceNow);

  const retailPrice = resolveTierPrice(product?.retailPrice, flashActive);
  const wholesalePrice = resolveTierPrice(product?.wholesalePrice, flashActive);
  const retailMrp = normalizePriceField(product?.retailPrice).mrp || retailPrice || 0;
  const wholesaleMrp = normalizePriceField(product?.wholesalePrice).mrp || wholesalePrice || 0;
  const forceRetailMrpForWholesaleMinQty = wholesaleApproved && safeQty < minWholesaleQty;
  if (forceRetailMrpForWholesaleMinQty) {
    return {
      price: retailMrp,
      type: 'retail',
      savingsPercent: null,
      originalPrice: null,
    };
  }
  const finalPrice = useWholesaleTier && wholesalePrice > 0 ? wholesalePrice : retailPrice;
  const type = useWholesaleTier && wholesalePrice > 0 ? 'wholesale' : 'retail';

  if (type === 'wholesale') {
    const savings = retailPrice > 0 ? Math.round(((retailPrice - finalPrice) / retailPrice) * 100) : 0;
    const originalPrice = wholesaleMrp > finalPrice ? wholesaleMrp : (retailPrice > finalPrice ? retailPrice : null);
    return {
      price: finalPrice,
      type,
      savingsPercent: savings > 0 ? savings : null,
      originalPrice,
    };
  }

  const retailOriginalPrice = retailMrp > finalPrice ? retailMrp : null;
  return {
    price: finalPrice,
    type: 'retail',
    savingsPercent: null,
    originalPrice: retailOriginalPrice,
  };
};

/**
 * Check if wholesale price should be shown
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const shouldShowWholesalePrice = (user = null) => {
  return canViewWholesalePrices(user);
};

/**
 * Format price for display
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Get price range for products with variants
 * @param {Object} product - Product object
 * @param {Object|null} user - User object from AuthContext
 * @returns {Object} - { min, max, formatted }
 */
export const getPriceRange = (product, user = null) => {
  const { price } = getDisplayPrice(product, user);
  return {
    min: price,
    max: price,
    formatted: formatPrice(price),
  };
};

/**
 * Calculate total cart value with applicable pricing
 * @param {Array} items - Cart items
 * @param {Object|null} user - User object from AuthContext
 * @returns {number}
 */
export const calculateCartTotal = (items, user = null) => {
  return items.reduce((total, item) => {
    const { price } = getDisplayPrice(item.product, user, item.quantity);
    return total + (price * item.quantity);
  }, 0);
};

/**
 * Calculate savings on cart for wholesale users
 * @param {Array} items - Cart items
 * @param {Object|null} user - User object from AuthContext
 * @returns {number}
 */
export const calculateCartSavings = (items, user = null) => {
  if (!isWholesaleUser(user)) return 0;
  
  return items.reduce((savings, item) => {
    const product = item.product;
    if (product.wholesalePrice && product.retailPrice) {
      const itemSavings = (product.retailPrice - product.wholesalePrice) * item.quantity;
      return savings + itemSavings;
    }
    return savings;
  }, 0);
};
