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
export const getDisplayPrice = (product, user = null) => {
  if (!product) {
    return {
      price: 0,
      type: 'retail',
      savingsPercent: null,
      originalPrice: null
    };
  }

  // Extract actual price values (handle both flat and nested structures)
  const getPriceAmount = (price) => {
    if (price == null) return 0;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') return Number(price) || 0;
    if (price.salePrice != null) return Number(price.salePrice) || 0;
    if (price.mrp != null) return Number(price.mrp) || 0;
    if (price.price != null) return Number(price.price) || 0;
    return 0;
  };

  const getRetailPrice = (product) => {
    if (typeof product.retailPrice === 'number') return product.retailPrice;
    if (product.retailPrice?.salePrice != null) return product.retailPrice.salePrice;
    if (product.retailPrice?.mrp != null) return product.retailPrice.mrp;
    if (product.price) return getPriceAmount(product.price);
    return 0;
  };

  const getWholesalePrice = (product) => {
    if (typeof product.wholesalePrice === 'number') return product.wholesalePrice;
    if (product.wholesalePrice?.salePrice != null) return product.wholesalePrice.salePrice;
    if (product.wholesalePrice?.mrp != null) return product.wholesalePrice.mrp;
    return null;
  };

  const retailPrice = getRetailPrice(product);
  const wholesalePrice = getWholesalePrice(product);

  // Wholesale users see wholesale price if available
  if (canViewWholesalePrices(user) && wholesalePrice) {
    const savings = Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100);
    return {
      price: wholesalePrice,
      type: 'wholesale',
      savingsPercent: savings > 0 ? savings : null,
      originalPrice: retailPrice
    };
  }

  // Retail users or products without wholesale price
  return {
    price: retailPrice,
    type: 'retail',
    savingsPercent: null,
    originalPrice: null
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
    const { price } = getDisplayPrice(item.product, user);
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
