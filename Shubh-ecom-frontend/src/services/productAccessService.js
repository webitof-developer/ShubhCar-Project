// src/services/productAccessService.js

import { isWholesaleUser, canPurchaseProduct } from './userTypeService';

/**
 * Product Access Service - PHASE 10A UPDATED
 * 
 * CRITICAL: All access functions now accept user as parameter
 * Caller must pass user from useAuth() or AuthContext
 * 
 * This ensures access decisions are based on CURRENT auth state
 */

/**
 * Filter products based on user access
 * @param {Array} products - Array of products
 * @param {Object|null} user - User object from AuthContext
 * @returns {Array} - Filtered products
 */
export const filterProductsByAccess = (products, user = null) => {
  if (!products || !Array.isArray(products)) return [];
  
  return products.filter(product => canPurchaseProduct(product, user));
};

/**
 * Check if product should be visible to user
 * @param {Object} product - Product object
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const isProductVisible = (product, user = null) => {
  if (!product) return false;
  
  // Wholesale-only products are hidden from retail users
  if (product.wholesaleOnly || product.productType === 'wholesale-only') {
    return isWholesaleUser(user);
  }
  
  return true;
};

/**
 * Get product type badge information
 * @param {Object} product - Product object
 * @param {Object|null} user - User object from AuthContext
 * @returns {Object|null} - Badge info or null
 */
export const getProductTypeBadge = (product, user = null) => {
  if (!product) return null;
  
  // OEM products get special badge
  if (product.productType === 'OEM') {
    return {
      label: 'OEM',
      variant: 'default', // Maps to badge variant
      description: 'Original Equipment Manufacturer'
    };
  }
  
  // Aftermarket products
  if (product.productType === 'AFTERMARKET') {
    return {
      label: 'Aftermarket',
      variant: 'secondary',
      description: 'Quality Aftermarket Part'
    };
  }
  
  // Wholesale-only indicator for wholesale users
  if (product.wholesaleOnly && isWholesaleUser(user)) {
    return {
      label: 'Wholesale Only',
      variant: 'outline',
      description: 'Available for wholesale customers'
    };
  }
  
  return null;
};

/**
 * Get accessibility message for blocked products
 * @param {Object} product - Product object
 * @param {Object|null} user - User object from AuthContext
 * @returns {Object|null} - Access message or null
 */
export const getAccessMessage = (product, user = null) => {
  if (!product) return null;
  
  if ((product.wholesaleOnly || product.productType === 'wholesale-only') && !isWholesaleUser(user)) {
    return {
      type: 'wholesale-required',
      message: 'This product is available for wholesale customers only.',
      action: 'Apply for wholesale account'
    };
  }
  
  return null;
};

/**
 * Sort products with OEM first (if user prefers quality)
 */
export const sortProductsByType = (products, sortType = 'default') => {
  if (!products || !Array.isArray(products)) return [];
  
  if (sortType === 'oem-first') {
    return [...products].sort((a, b) => {
      const aIsOEM = a.productType === 'OEM';
      const bIsOEM = b.productType === 'OEM';
      
      if (aIsOEM && !bIsOEM) return -1;
      if (!aIsOEM && bIsOEM) return 1;
      return 0;
    });
  }
  
  return products;
};

/**
 * Get product compatibility information
 */
export const getCompatibilityInfo = (product) => {
  if (!product) return null;
  
  return {
    vehicles: product.compatibleVehicles || [],
    oemCode: product.oemNumber || product.partNumber,
    fitmentNotes: product.fitmentNotes || null,
    hasCompatibilityData: Boolean(product.compatibleVehicles?.length || product.oemNumber)
  };
};
