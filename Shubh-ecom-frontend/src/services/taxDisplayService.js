//src/services/taxDisplayService.js

/**
 * Tax Display Service - Frontend Only
 * 
 * CRITICAL RULES:
 * 1. This service does NOT calculate tax amounts
 * 2. It only formats backend-provided tax data for display
 * 3. All tax calculations are done by the backend
 * 4. This service reads display rules from app.config.js OR runtime config
 * 
 * Purpose: Provide consistent tax display across all frontend components
 */

import APP_CONFIG from '@/config/app.config';
import { formatPrice } from './pricingService';

/**
 * Get tax suffix text based on display mode
 * @param {string} displayMode - 'including' | 'excluding'
 * @param {Object} runtimeConfig - Optional runtime tax config from useSiteConfig
 * @returns {string} - e.g., "incl. taxes" or "+ applicable taxes"
 */
export function getTaxSuffix(displayMode = 'including', runtimeConfig = null) {
  const config = runtimeConfig?.display?.suffixes || APP_CONFIG.site?.tax?.display?.suffixes || {};
  return displayMode === 'including' 
    ? (config.including || 'incl. taxes')
    : (config.excluding || '+ applicable taxes');
}

/**
 * Get tax help/tooltip text
 * @param {string} displayMode - 'including' | 'excluding'
 * @param {Object} runtimeConfig - Optional runtime tax config from useSiteConfig
 * @returns {string} - Explanation text for tooltips
 */
export function getTaxHelpText(displayMode = 'including', runtimeConfig = null) {
  const help = runtimeConfig?.help || APP_CONFIG.site?.tax?.help || {};
  return displayMode === 'including'
    ? (help.including || 'Price includes all applicable taxes')
    : (help.excluding || 'Tax will be calculated at checkout');
}

/**
 * Format tax breakdown for display
 * Filters out zero-value components if configured
 * 
 * @param {Object} taxBreakdown - { cgst, sgst, igst }
 * @param {Object} runtimeConfig - Optional runtime tax config from useSiteConfig
 * @returns {Array<{key: string, label: string, value: number, formatted: string}>}
 */
export function formatTaxBreakdown(taxBreakdown = {}, runtimeConfig = null) {
  const config = runtimeConfig?.display || APP_CONFIG.site?.tax?.display || {};
  const labels = config.breakdownLabels || {};
  const hideZero = config.hideZeroComponents !== false;
  
  const components = [
    { key: 'cgst', label: labels.cgst || 'CGST', value: taxBreakdown.cgst || 0 },
    { key: 'sgst', label: labels.sgst || 'SGST', value: taxBreakdown.sgst || 0 },
    { key: 'igst', label: labels.igst || 'IGST', value: taxBreakdown.igst || 0 },
  ];
  
  return components
    .filter(c => !hideZero || c.value > 0)
    .map(c => ({
      ...c,
      formatted: formatPrice(c.value),
    }));
}

/**
 * Get tax row label for summaries
 * @param {Object} runtimeConfig - Optional runtime tax config from useSiteConfig
 * @returns {string} - e.g., "Tax" or "GST"
 */
export function getTaxLabel(runtimeConfig = null) {
  return runtimeConfig?.display?.taxRowLabel || APP_CONFIG.site?.tax?.display?.taxRowLabel || 'Tax';
}

/**
 * Check if tax breakdown should be shown
 * @param {Object} runtimeConfig - Optional runtime tax config from useSiteConfig
 * @returns {boolean}
 */
export function shouldShowTaxBreakdown(runtimeConfig = null) {
  const config = runtimeConfig?.display || APP_CONFIG.site?.tax?.display || {};
  return config.showBreakdown !== false;
}

/**
 * Get complete tax display data for summary components
 * This is the main function to use in cart/checkout summaries
 * 
 * @param {Object} summary - Backend summary with taxAmount, taxBreakdown, settings
 * @param {Object} runtimeConfig - Optional runtime tax config from useSiteConfig
 * @returns {Object} - Complete tax display data
 */
export function getTaxDisplayData(summary = {}, runtimeConfig = null) {
  const displayMode = summary?.settings?.taxPriceDisplayCart || 'including';
  
  return {
    amount: summary.taxAmount || 0,
    formatted: formatPrice(summary.taxAmount || 0),
    label: getTaxLabel(runtimeConfig),
    suffix: getTaxSuffix(displayMode, runtimeConfig),
    helpText: getTaxHelpText(displayMode, runtimeConfig),
    breakdown: formatTaxBreakdown(summary.taxBreakdown, runtimeConfig),
    showBreakdown: shouldShowTaxBreakdown(runtimeConfig),
  };
}
