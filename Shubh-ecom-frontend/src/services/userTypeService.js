// src/services/userTypeService.js

/**
 * User Type Service - PHASE 10A REFACTOR
 * 
 * CRITICAL: All functions are PURE - they accept user as parameter
 * NO internal calls to getCurrentUser() or auth state fetching
 * 
 * Callers MUST pass user from useAuth() or AuthContext
 */

/**
 * Check if user is an approved wholesale user
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const isWholesaleUser = (user) => {
  if (!user) {
    return false; // Null user = retail (lowest privilege)
  }
  const byLegacyFields = user?.type === 'wholesale' && user?.wholesaleStatus === 'approved';
  const byCurrentFields = user?.customerType === 'wholesale' && user?.verificationStatus === 'approved';
  return byLegacyFields || byCurrentFields;
};

/**
 * Check if user is a retail user
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const isRetailUser = (user) => {
  return !user || user?.type === 'retail' || user?.customerType === 'retail';
};

/**
 * Check if user can view wholesale prices
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const canViewWholesalePrices = (user) => {
  return isWholesaleUser(user);
};

/**
 * Get minimum order quantity for a product based on user type
 * @param {Object} product - Product object
 * @param {Object|null} user - User object from AuthContext
 * @returns {number}
 */
export const getMinimumOrderQuantity = (product, user) => {
  if (!product) return 1;
  
  if (isWholesaleUser(user)) {
    return product.wholesaleMinQty || product.minOrderQty || 10;
  }
  
  return 1; // Retail users can order single items
};

/**
 * Check if user can purchase a specific product
 * @param {Object} product - Product object
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const canPurchaseProduct = (product, user) => {
  if (!product) return false;
  if (!user) {
    // Not logged in - can only see non-wholesale products
    if (product.wholesaleOnly) {
      return false;
    }
    return true;
  }
  
  // Wholesale-only products
  if (product.wholesaleOnly) {
    return isWholesaleUser(user);
  }
  
  // All other products available to all users
  return true;
};

/**
 * Get user type display name
 * @param {Object|null} user - User object from AuthContext
 * @returns {string}
 */
export const getUserTypeLabel = (user) => {
  if (isWholesaleUser(user)) return 'Wholesale';
  return 'Retail';
};

/**
 * Check if user's wholesale account is pending approval
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const isWholesalePending = (user) => {
  if (!user) return false;
  return (user?.type === 'wholesale' && user?.wholesaleStatus === 'pending') ||
    (user?.customerType === 'wholesale' && user?.verificationStatus === 'pending');
};

/**
 * Check if user's wholesale account is rejected
 * @param {Object|null} user - User object from AuthContext
 * @returns {boolean}
 */
export const isWholesaleRejected = (user) => {
  if (!user) return false;
  return (user?.type === 'wholesale' && user?.wholesaleStatus === 'rejected') ||
    (user?.customerType === 'wholesale' && user?.verificationStatus === 'rejected');
};
