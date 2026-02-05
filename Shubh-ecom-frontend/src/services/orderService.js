//src/services/orderService.js

import APP_CONFIG from '@/config/app.config';
import { orders as demoOrders } from '@/data/orders';

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

const API_BASE = APP_CONFIG.api.baseUrl;

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

/**
 * Log data source being used
 * @param {string} method - Method name
 * @param {boolean} isDemo - Whether demo data is being used
 */
const logDataSource = (method, isDemo) => {
  console.log(`[ORDER_SERVICE] ${method} - USING ${isDemo ? 'DEMO' : 'REAL'} DATA`);
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
  console.log('[ORDER_SERVICE] Placing order - USING REAL BACKEND');
  console.log('[ORDER_SERVICE] Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NULL/UNDEFINED');
  
  try {
    const readResponseBody = async (response) => {
      const text = await response.text();
      if (!text) return { text: '', json: null };
      try {
        return { text, json: JSON.parse(text) };
      } catch {
        return { text, json: null };
      }
    };

    const normalizeGateway = (method, gateway) => {
      if (gateway) return gateway;
      if (method === 'razorpay') return 'razorpay';
      return undefined;
    };
    const payload = {
      ...orderData,
      gateway: normalizeGateway(orderData?.paymentMethod, orderData?.gateway),
    };
    const response = await fetch(`${API_BASE}/orders/place`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const { text, json } = await readResponseBody(response);
    const body = json || null;
    const errorMessage =
      body?.message ||
      body?.error?.message ||
      text ||
      `Order request failed (${response.status})`;

    if (!response.ok || body?.success === false) {
      const err = new Error(errorMessage);
      err.status = response.status;
      err.statusText = response.statusText;
      err.url = response.url;
      err.responseBody = body;
      err.responseText = text;
      console.error('[ORDER_SERVICE] Place order failed:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body,
        text,
      });
      throw err;
    }

    const result = body || {};
    console.log('[ORDER_SERVICE] Order placed successfully:', result.data?.orderNumber);
    
    return result.data || result;
  } catch (error) {
    console.error('[ORDER_SERVICE] Place order error:', error);
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
  
  try {
    const params = new URLSearchParams();
    if (includeItems) params.set('includeItems', '1');
    const url = params.toString() ? `${API_BASE}/orders/my?${params.toString()}` : `${API_BASE}/orders/my`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('[ORDER_SERVICE] Failed to fetch orders');
      
      // Fallback to demo if configured
      if (useFallback) {
        console.warn('[ORDER_SERVICE] Falling back to demo orders');
        return [...demoOrders];
      }
      
      return [];
    }

    const result = await response.json();
    console.log('[ORDER_SERVICE] Orders fetched -', result.data?.length || 0, 'orders');
    
    return result.data || [];
  } catch (error) {
    console.error('[ORDER_SERVICE] Fetch orders error:', error);
    
    // Fallback to demo if configured
    if (useFallback) {
      console.warn('[ORDER_SERVICE] Falling back to demo orders');
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
  
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('[ORDER_SERVICE] Failed to fetch order');
      
      // Fallback to demo if configured
      if (useFallback) {
        console.warn('[ORDER_SERVICE] Falling back to demo order');
        const order = demoOrders.find(o => o._id === orderId || o.orderNumber === orderId);
        return order || null;
      }
      
      return null;
    }

    const result = await response.json();
    console.log('[ORDER_SERVICE] Order fetched successfully');
    
    return result.data;
  } catch (error) {
    console.error('[ORDER_SERVICE] Fetch order error:', error);
    
    // Fallback to demo if configured  
    if (useFallback) {
      console.warn('[ORDER_SERVICE] Falling back to demo order');
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
  console.log('[ORDER_SERVICE] Cancelling order:', orderId);
  
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[ORDER_SERVICE] Cancel order failed:', error);
      throw new Error(error.message || 'Failed to cancel order');
    }

    const result = await response.json();
    console.log('[ORDER_SERVICE] Order cancelled successfully');
    
    return result.data;
  } catch (error) {
    console.error('[ORDER_SERVICE] Cancel order error:', error);
    throw error;
  }
};
