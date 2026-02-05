// src/utils/dataSourceFallback.js

/**
 * ============================================================================
 * DATA SOURCE FALLBACK UTILITY
 * ============================================================================
 * 
 * Handles fallback behavior when primary data source fails.
 * Used by all services to ensure consistent fallback handling.
 * 
 * USAGE:
 * ```javascript
 * try {
 *   const data = await fetchReal();
 *   return data;
 * } catch (error) {
 *   return handleDataSourceFallback('PRODUCTS', fallbackMode, demoData, error);
 * }
 * ```
 */

import { logDataSource } from '@/config/app.config';

/**
 * Handle fallback when primary data source fails
 * 
 * @param {string} domain - Domain name (e.g., 'PRODUCTS', 'PROFILE.BASIC')
 * @param {string} fallbackMode - 'demo' | 'empty' | 'error'
 * @param {any} demoData - Demo data to return (if fallbackMode is 'demo')
 * @param {Error} error - Original error (if any)
 * @returns {any} - Fallback data or throws error
 */
export function handleDataSourceFallback(domain, fallbackMode, demoData, error = null) {
  switch (fallbackMode) {
    case 'demo':
      // Fallback to demo data
      logDataSource(domain, 'DEMO', 'fallback from real');
      console.log(`[FALLBACK] ${domain}: Using demo data as fallback`);
      return demoData;
    
    case 'empty':
      // Return empty state (null for single items, [] for collections)
      logDataSource(domain, 'EMPTY', error ? 'real failed' : 'real returned empty');
      console.log(`[FALLBACK] ${domain}: Returning empty state`);
      return Array.isArray(demoData) ? [] : null;
    
    case 'error':
      // Throw error to surface to UI
      logDataSource(domain, 'ERROR', 'real failed');
      console.error(`[FALLBACK] ${domain}: Throwing error`, error);
      throw error || new Error(`Failed to fetch ${domain}`);
    
    default:
      // Unknown fallback mode, use safe demo fallback
      console.warn(`[FALLBACK] ${domain}: Unknown fallback mode '${fallbackMode}', using demo`);
      return demoData;
  }
}

/**
 * Check if data is empty
 * @param {any} data - Data to check
 * @returns {boolean} - True if data is empty
 */
export function isDataEmpty(data) {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  if (typeof data === 'object' && Object.keys(data).length === 0) return true;
  return false;
}
