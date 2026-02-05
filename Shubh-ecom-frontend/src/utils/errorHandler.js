// src/utils/errorHandler.js

/**
 * Centralized Error Handler
 * 
 * Normalizes backend errors and provides consistent user feedback.
 * Handles common HTTP status codes with appropriate actions.
 */

import { toast } from 'sonner';
import { getDisplayPrice } from '@/services/pricingService';

/**
 * Error categories
 */
export const ErrorType = {
  AUTH: 'auth',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  FORBIDDEN: 'forbidden',
  SERVER: 'server',
  NETWORK: 'network',
  UNKNOWN: 'unknown',
};

/**
 * Normalize backend error response
 * @param {Error} error - Error object
 * @param {Response} response - Optional HTTP response
 * @returns {Object} Normalized error
 */
export function normalizeError(error, response = null) {
  const responseStatus =
    error?.status ||
    error?.response?.status ||
    response?.status ||
    null;
  const responseBody =
    error?.responseBody ||
    error?.response?.body ||
    error?.response ||
    null;
  const responseText =
    error?.responseText ||
    error?.response?.text ||
    null;
  const backendMessage =
    responseBody?.message ||
    responseBody?.error?.message ||
    responseText ||
    null;

  // Network error (no response)
  if (!response && error.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network error. Please check your connection.',
      statusCode: 0,
      details: null,
    };
  }

  // Backend error with response
  if (response || responseStatus) {
    const statusCode = responseStatus || response?.status;
    const messageFromError = error?.message || backendMessage || 'An unexpected error occurred.';

    switch (statusCode) {
      case 401:
        return {
          type: ErrorType.AUTH,
          message: backendMessage || 'Your session has expired. Please log in again.',
          statusCode: 401,
          details: responseBody || null,
          action: 'redirect_login',
        };

      case 403:
        return {
          type: ErrorType.FORBIDDEN,
          message: backendMessage || 'You do not have permission to perform this action.',
          statusCode: 403,
          details: responseBody || null,
        };

      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          message: backendMessage || 'The requested resource was not found.',
          statusCode: 404,
          details: responseBody || null,
        };

      case 422:
        return {
          type: ErrorType.VALIDATION,
          message: backendMessage || error.message || 'Validation failed. Please check your input.',
          statusCode: 422,
          details: error.details || responseBody || null,
        };

      case 500:
      case 502:
      case 503:
        return {
          type: ErrorType.SERVER,
          message: backendMessage || 'Server error. Please try again later.',
          statusCode,
          details: responseBody || null,
        };

      default:
        return {
          type: ErrorType.UNKNOWN,
          message: messageFromError,
          statusCode,
          details: responseBody || null,
        };
    }
  }

  // Generic error
  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || backendMessage || 'An unexpected error occurred.',
    statusCode: responseStatus,
    details: responseBody || null,
  };
}

/**
 * Handle error with appropriate UI feedback
 * @param {Error} error - Error object
 * @param {Object} context - Context information (page, action, etc.)
 * @returns {Object} Normalized error
 */
export function handleError(error, context = {}) {
  const normalized = normalizeError(error, error.response);
  
  console.error(`[ERROR_HANDLER] ${context.page || 'Unknown'}:`, {
    type: normalized.type,
    message: normalized.message,
    statusCode: normalized.statusCode,
    details: normalized.details,
    stack: error?.stack,
    responseBody: error?.responseBody,
    responseText: error?.responseText,
    status: error?.status,
    context,
  });

  // Show toast notification
  switch (normalized.type) {
    case ErrorType.AUTH:
      toast.error('Session Expired', {
        description: normalized.message,
      });
      break;

    case ErrorType.VALIDATION:
      toast.error('Validation Error', {
        description: normalized.message,
      });
      break;

    case ErrorType.NOT_FOUND:
      toast.error('Not Found', {
        description: normalized.message,
      });
      break;

    case ErrorType.FORBIDDEN:
      toast.error('Access Denied', {
        description: normalized.message,
      });
      break;

    case ErrorType.SERVER:
      toast.error('Server Error', {
        description: normalized.message,
      });
      break;

    case ErrorType.NETWORK:
      toast.error('Network Error', {
        description: normalized.message,
      });
      break;

    default:
      toast.error('Error', {
        description: normalized.message,
      });
  }

  return normalized;
}

/**
 * Validate cart before order placement
 * @param {Array} cartItems - Cart items
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateCart(cartItems, user = null) {
  // Empty cart
  if (!cartItems || cartItems.length === 0) {
    return {
      valid: false,
      error: 'Your cart is empty. Please add items before checkout.',
    };
  }

  // Check each item
  for (const item of cartItems) {
    // Missing product
    if (!item.product) {
      return {
        valid: false,
        error: 'Invalid cart item. Please refresh and try again.',
      };
    }

    // Invalid quantity
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return {
        valid: false,
        error: `Invalid quantity for ${item.product.name}. Please update your cart.`,
      };
    }

    // Missing price
    const { price } = getDisplayPrice(item.product, user);
    if (!Number.isFinite(price) || price <= 0) {
      return {
        valid: false,
        error: `Price missing for ${item.product.name}. Please contact support.`,
      };
    }
  }

  return { valid: true, error: null };
}
