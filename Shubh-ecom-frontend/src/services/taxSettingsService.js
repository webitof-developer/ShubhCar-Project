/**
 * Tax Settings Service - Backend Integration
 * 
 * CRITICAL RULES:
 * 1. This service ONLY fetches tax settings from backend
 * 2. It does NOT perform any tax calculations
 * 3. It normalizes backend data for frontend consumption
 * 4. It provides fallback to static config on errors
 * 
 * Purpose: Hydrate frontend tax config with backend settings
 */

import APP_CONFIG from '@/config/app.config';

const API_BASE_URL = APP_CONFIG.api.baseUrl;
const readJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Fetch tax settings from backend
 * @returns {Promise<Object>} - Normalized tax settings
 */
export async function fetchTaxSettings() {
  try {

    const response = await fetch(`${API_BASE_URL}/settings/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh settings
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await readJsonSafe(response);

    // Backend returns { success: true, data: { key: value, ... } }
    const settings = data?.data || data || {};

   

    return normalizeTaxSettings(settings);
  } catch (error) {
    console.warn('[DATA] TAX.SETTINGS: FALLBACK TO CONFIG', error.message);
    return getFallbackSettings();
  }
}

/**
 * Normalize backend tax settings to match frontend config structure
 * @param {Object} backendSettings - Raw backend settings
 * @returns {Object} - Normalized settings matching app.config.js structure
 */
function normalizeTaxSettings(backendSettings) {
  // Parse and validate tax rate (clamp between 0-100%)
  const rawRate = parseFloat(backendSettings.tax_rate) || 0;
  const validatedRate = Math.min(100, Math.max(0, rawRate));
  
  const normalized = {
    defaultRate: validatedRate,
    displayShop: backendSettings.tax_price_display_shop || 'including',
    displayCart: backendSettings.tax_price_display_cart || 'including',
    pricesIncludeTax: backendSettings.prices_include_tax === true || backendSettings.prices_include_tax === 'true',
  };

  // Map backend display mode to frontend suffix
  const displayMode = normalized.displayShop;
  const staticConfig = APP_CONFIG.site?.tax?.display || {};

  // Override static config with backend values
  normalized.display = {
    suffixes: {
      including: staticConfig.suffixes?.including || 'incl. taxes',
      excluding: staticConfig.suffixes?.excluding || '+ applicable taxes',
    },
    breakdownLabels: staticConfig.breakdownLabels || {
      cgst: 'CGST',
      sgst: 'SGST',
      igst: 'IGST',
      tax: 'Tax',
      gst: 'GST',
    },
    showBreakdown: staticConfig.showBreakdown !== false,
    hideZeroComponents: staticConfig.hideZeroComponents !== false,
    taxRowLabel: staticConfig.taxRowLabel || 'Tax',
  };

  // Help text from static config
  normalized.help = {
    including: staticConfig.help?.including || 'Price includes all applicable taxes',
    excluding: staticConfig.help?.excluding || 'Tax will be calculated at checkout',
  };

  return normalized;
}

/**
 * Get fallback settings from static config
 * @returns {Object} - Static tax settings from app.config.js
 */
function getFallbackSettings() {
  const staticTax = APP_CONFIG.site?.tax || {};

  return {
    defaultRate: staticTax.defaultRate || 0,
    displayShop: staticTax.displayShop || 'including',
    displayCart: staticTax.displayCart || 'including',
    pricesIncludeTax: staticTax.pricesIncludeTax !== false,
    display: staticTax.display || {
      suffixes: {
        including: 'incl. taxes',
        excluding: '+ applicable taxes',
      },
      breakdownLabels: {
        cgst: 'CGST',
        sgst: 'SGST',
        igst: 'IGST',
        tax: 'Tax',
        gst: 'GST',
      },
      showBreakdown: true,
      hideZeroComponents: true,
      taxRowLabel: 'Tax',
    },
    help: staticTax.help || {
      including: 'Price includes all applicable taxes',
      excluding: 'Tax will be calculated at checkout',
    },
  };
}

/**
 * Merge backend tax settings with static config
 * This is the main function to be called during app initialization
 * @returns {Promise<Object>} - Merged tax configuration
 */
export async function getMergedTaxConfig() {
  const backendSettings = await fetchTaxSettings();
  const staticConfig = APP_CONFIG.site?.tax || {};

  // Backend settings take precedence over static config
  return {
    ...staticConfig,
    ...backendSettings,
    // Ensure display and help objects are properly merged
    display: {
      ...staticConfig.display,
      ...backendSettings.display,
    },
    help: {
      ...staticConfig.help,
      ...backendSettings.help,
    },
  };
}

/**
 * Check if dynamic settings are enabled
 * @returns {boolean}
 */
export function isDynamicSettingsEnabled() {
  return APP_CONFIG.site?.tax?.dynamicSettings !== false;
}
