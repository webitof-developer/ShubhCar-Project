//src/services/orderService.js

import APP_CONFIG from '@/config/app.config';
import { orders as demoOrders } from '@/data/orders';
import { logger } from '@/utils/logger';
import { api } from '@/utils/apiClient';

/**
 * Order Service
 * 
 * Handles all order-related operations with backend
 * Supports config-driven demo/real data sourcing
 * - Place orders (always real - cannot place demo orders)
 * - Fetch user orders (demo/real based on config)
 * - Get order details (demo/real based on config)
 * Requires authentication (access token)
 */

/**
 * Get data source configuration with fallback
 * @param {string} source - Primary data source
 * @param {string} fallback - Fallback data source
 * @returns {object} - { useDemo, useFallback }
 */
const getDataSourceConfig = (source, fallback) => {
  const useDemo = source === 'demo';
  const useFallback = fallback === 'demo';
  return { useDemo, useFallback };
};

const extractOrdersArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.orders)) return payload.orders;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.docs)) return payload.docs;
  }
  return [];
};

/**
 * Log data source being used
 * @param {string} method - Method name
 * @param {boolean} isDemo - Whether demo data is being used
 */
const logDataSource = (method, isDemo) => {
};

/**
 * Place an order (ALWAYS REAL - Cannot place demo orders)
 * @param {string} accessToken - Access token
 * @param {object} orderData - Order data
 * @param {string} orderData.paymentMethod - "cod" | "online"
 * @param {string} orderData.shippingAddressId - Address ID
 * @param {string} orderData.billingAddressId - Address ID (optional)
 * @param {string} orderData.notes - Optional notes
 * @returns {Promise<object>} - Created order
 */
export const placeOrder = async (accessToken, orderData) => {
  
  try {
    const normalizeGateway = (method, gateway) => {
      if (gateway) return gateway;
      if (method === 'razorpay') return 'razorpay';
      return undefined;
    };
    const payload = {
      ...orderData,
      gateway: normalizeGateway(orderData?.paymentMethod, orderData?.gateway),
    };
    return await api.authPost('/orders/place', payload, accessToken);
  } catch (error) {
    logger.error('[ORDER_SERVICE] Place order error:', error);
    throw error;
  }
};

/**
 * Get user's orders (DEMO/REAL based on config)
 * @param {string} accessToken - Access token
 * @param {object} options - Options
 * @param {boolean} options.includeItems - Include order items
 * @returns {Promise<Array>} - List of orders
 */
export const getMyOrders = async (accessToken, { includeItems } = {}) => {
  const config = APP_CONFIG.dataSource.orders;
  const { useDemo, useFallback } = getDataSourceConfig(config.source, config.fallback);
  
  // Demo mode
  if (useDemo) {
    logDataSource('getMyOrders', true);
    return Promise.resolve([...demoOrders]);
  }
  
  // Real mode
  logDataSource('getMyOrders', false);

  if (!accessToken) {
    logger.warn('[ORDER_SERVICE] Missing access token for getMyOrders');
    return useFallback ? [...demoOrders] : [];
  }
  
  try {
    const params = new URLSearchParams();
    if (typeof includeItems === 'boolean') params.set('includeItems', String(includeItems));
    const path = params.toString() ? `/orders/my?${params.toString()}` : '/orders/my';
    const payload = await api.authGet(path, accessToken);
    const orders = extractOrdersArray(payload);
    return orders;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[ORDER_SERVICE] Fetch orders error: ${message}`);
    
    // Fallback to demo if configured
    if (useFallback) {
      logger.warn('[ORDER_SERVICE] Falling back to demo orders');
      return [...demoOrders];
    }
    
    return [];
  }
};


/**
 * Get order details by ID (DEMO/REAL based on config)
 * @param {string} accessToken - Access token
 * @param {string} orderId - Order ID
 * @returns {Promise<object|null>} - Order details or null
 */
export const getOrder = async (accessToken, orderId) => {
  const config = APP_CONFIG.dataSource.orders;
  const { useDemo, useFallback } = getDataSourceConfig(config.source, config.fallback);
  
  // Demo mode
  if (useDemo) {
    logDataSource('getOrder', true);
    const order = demoOrders.find(o => o._id === orderId || o.orderNumber === orderId);
    return Promise.resolve(order || null);
  }
  
  // Real mode
  logDataSource('getOrder', false);

  if (!accessToken) {
    logger.warn('[ORDER_SERVICE] Missing access token for getOrder');
    if (useFallback) {
      return demoOrders.find(o => o._id === orderId || o.orderNumber === orderId) || null;
    }
    return null;
  }
  
  try {
    return await api.authGet(`/orders/${orderId}`, accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[ORDER_SERVICE] Fetch order error: ${message}`);
    
    // Fallback to demo if configured  
    if (useFallback) {
      logger.warn('[ORDER_SERVICE] Falling back to demo order');
      const order = demoOrders.find(o => o._id === orderId || o.orderNumber === orderId);
      return order || null;
    }
    
    return null;
  }
};

/**
 * Cancel an order
 * @param {string} accessToken - Access token
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object|null>} - Updated order or null
 */
export const cancelOrder = async (accessToken, orderId, reason) => {
  
  try {
    return await api.authPost(`/orders/${orderId}/cancel`, { reason }, accessToken);
  } catch (error) {
    logger.error('[ORDER_SERVICE] Cancel order error:', error);
    throw error;
  }
};

