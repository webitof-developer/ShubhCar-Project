/**
 * Pricing Utility
 * Handles dual pricing logic for retail vs wholesale customers
 */

/**
 * Calculate display price based on user type and quantity
 * @param {Object} product - Product object with pricing info
 * @param {Object} user - Current user object
 * @param {Number} quantity - Order quantity (default: 1)
 * @returns {Object} Price information
 */
export function calculatePrice(product, user = null, quantity = 1) {
  const isWholesale = user?.customerType === 'wholesale' && 
                      user?.verificationStatus === 'approved'
  
  const meetsWholesaleQty = product.minWholesaleQty && quantity >= product.minWholesaleQty
  
  // Wholesale pricing logic
  if (isWholesale && meetsWholesaleQty && product.wholesalePrice) {
    return {
      price: product.wholesalePrice.salePrice || product.wholesalePrice.mrp,
      mrp: product.wholesalePrice.mrp,
      discount: product.wholesalePrice.salePrice 
        ? Math.round(((product.wholesalePrice.mrp - product.wholesalePrice.salePrice) / product.wholesalePrice.mrp) * 100)
        : 0,
      type: 'wholesale'
    }
  }
  
  // Retail pricing logic
  return {
    price: product.retailPrice.salePrice || product.retailPrice.mrp,
    mrp: product.retailPrice.mrp,
    discount: product.retailPrice.salePrice 
      ? Math.round(((product.retailPrice.mrp - product.retailPrice.salePrice) / product.retailPrice.mrp) * 100)
      : 0,
    type: 'retail'
  }
}

/**
 * Format price for display
 */
export function formatPrice(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Check if wholesale pricing is available
 */
export function hasWholesalePrice(product) {
  return !!(product.minWholesaleQty && product.wholesalePrice)
}
