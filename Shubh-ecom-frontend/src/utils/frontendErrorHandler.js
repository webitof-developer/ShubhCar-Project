// src/utils/frontendErrorHandler.js

/**
 * ============================================================================
 * CENTRALIZED FRONTEND ERROR HANDLER
 * ============================================================================
 * 
 * Handles all frontend errors with consistent user feedback.
 * Integrates with Sonner toast for notifications.
 * 
 * USAGE:
 * ```javascript
 * try {
 *   await someService.call();
 * } catch (error) {
 *   handleFrontendError(error, { context: 'product_page' });
 * }
 * ```
 */

import { toast } from 'sonner';

// ============================================================================
// ERROR TYPES
// ============================================================================

export const ErrorType = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  FORBIDDEN: 'forbidden',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

// ============================================================================
// ERROR DEDUPLICATION
// ============================================================================

const recentErrors = new Map();
const ERROR_COOLDOWN_MS = 3000; // Don't show same error within 3 seconds

function shouldShowError(errorKey) {
  const now = Date.now();
  const lastShown = recentErrors.get(errorKey);
  
  if (lastShown && now - lastShown < ERROR_COOLDOWN_MS) {
    return false; // Same error shown recently
  }
  
  recentErrors.set(errorKey, now);
  
  // Cleanup old entries
  if (recentErrors.size > 50) {
    const oldestKey = Array.from(recentErrors.keys())[0];
    recentErrors.delete(oldestKey);
  }
  
  return true;
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Classify error and extract user-friendly message
 * @param {Error|Object} error - Error object
 * @returns {Object} - { type, title, message, statusCode }
 */
function classifyError(error) {
  // Network errors (no response)
  if (!error.response && (error.message?.includes('fetch') || error.message?.includes('network'))) {
    return {
      type: ErrorType.NETWORK,
      title: 'Network Error',
      message: 'Please check your internet connection and try again.',
      statusCode: 0,
    };
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
    return {
      type: ErrorType.TIMEOUT,
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      statusCode: 408,
    };
  }

  // HTTP status code errors
  const statusCode = error.statusCode || error.status || error.response?.status;
  
  switch (statusCode) {
    case 400:
      return {
        type: ErrorType.VALIDATION,
        title: 'Invalid Request',
        message: error.message || 'Please check your input and try again.',
        statusCode: 400,
      };

    case 401:
      return {
        type: ErrorType.AUTH,
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        statusCode: 401,
      };

    case 403:
      return {
        type: ErrorType.FORBIDDEN,
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        statusCode: 403,
      };

    case 404:
      return {
        type: ErrorType.NOT_FOUND,
        title: 'Not Found',
        message: error.message || 'The requested resource was not found.',
        statusCode: 404,
      };

    case 422:
      return {
        type: ErrorType.VALIDATION,
        title: 'Validation Error',
        message: error.message || 'Please check your input and try again.',
        statusCode: 422,
      };

    case 500:
    case 502:
    case 503:
      return {
        type: ErrorType.SERVER,
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        statusCode,
      };

    default:
      return {
        type: ErrorType.UNKNOWN,
        title: 'Error',
        message: error.message || 'An unexpected error occurred.',
        statusCode: statusCode || 500,
      };
  }
}

// ============================================================================
// MAIN ERROR HANDLER
// ============================================================================

/**
 * Handle frontend error with user feedback
 * 
 * @param {Error|Object} error - Error object
 * @param {Object} options - Additional options
 * @param {string} options.context - Context where error occurred (e.g., 'product_page')
 * @param {boolean} options.silent - Don't show toast (default: false)
 * @param {string} options.customMessage - Override default message
 * @param {Function} options.onError - Callback after error is handled
 */
export function handleFrontendError(error, options = {}) {
  const {
    context = 'unknown',
    silent = false,
    customMessage = null,
    onError = null,
  } = options;

  // Classify error
  const classified = classifyError(error);
  
  // Log error
  console.error(`[FRONTEND_ERROR] ${context}:`, {
    type: classified.type,
    statusCode: classified.statusCode,
    message: classified.message,
    originalError: error,
  });

  // Create error key for deduplication
  const errorKey = `${classified.type}:${classified.message}`;

  // Show toast (if not silent and not duplicate)
  if (!silent && shouldShowError(errorKey)) {
    const message = customMessage || classified.message;
    
    switch (classified.type) {
      case ErrorType.AUTH:
        toast.error(classified.title, {
          description: message,
          duration: 5000,
        });
        break;

      case ErrorType.VALIDATION:
        toast.error(classified.title, {
          description: message,
          duration: 4000,
        });
        break;

      case ErrorType.NOT_FOUND:
        toast.error(classified.title, {
          description: message,
          duration: 4000,
        });
        break;

      case ErrorType.NETWORK:
        toast.error(classified.title, {
          description: message,
          duration: 6000,
        });
        break;

      case ErrorType.SERVER:
        toast.error(classified.title, {
          description: message,
          duration: 5000,
        });
        break;

      default:
        toast.error(classified.title, {
          description: message,
          duration: 4000,
        });
    }
  }

  // Execute callback
  if (onError) {
    onError(classified);
  }

  return classified;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Show success toast
 */
export function showSuccess(message, description = '') {
  toast.success(message, description ? { description } : undefined);
}

/**
 * Show info toast
 */
export function showInfo(message, description = '') {
  toast.info(message, description ? { description } : undefined);
}

/**
 * Show warning toast
 */
export function showWarning(message, description = '') {
  toast.warning(message, description ? { description } : undefined);
}
