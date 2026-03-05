import APP_CONFIG from '@/config/app.config';
import { api } from '@/utils/apiClient';
import { logger } from '@/utils/logger';

/**
 * Tax Settings Service - Backend Integration
 */

export async function fetchTaxSettings() {
  try {
    const settings = await api.get('/settings/public', { cache: 'no-store' });
    return normalizeTaxSettings(settings || {});
  } catch (error) {
    logger.warn('[DATA] TAX.SETTINGS: FALLBACK TO CONFIG', error.message);
    return getFallbackSettings();
  }
}

function normalizeTaxSettings(backendSettings) {
  const rawRate = parseFloat(backendSettings.tax_rate) || 0;
  const validatedRate = Math.min(100, Math.max(0, rawRate));

  const normalized = {
    defaultRate: validatedRate,
    displayShop: backendSettings.tax_price_display_shop || 'including',
    displayCart: backendSettings.tax_price_display_cart || 'including',
    pricesIncludeTax: backendSettings.prices_include_tax === true || backendSettings.prices_include_tax === 'true',
    taxDisplayTotals:
      backendSettings.tax_display_totals === undefined
        ? true
        : backendSettings.tax_display_totals === true || backendSettings.tax_display_totals === 'true',
    customSuffix: backendSettings.tax_price_display_suffix || '',
  };

  const displayMode = normalized.displayShop;
  const staticConfig = APP_CONFIG.site?.tax?.display || {};

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
    customSuffix: normalized.customSuffix || staticConfig.customSuffix || '',
  };

  normalized.help = {
    including: staticConfig.help?.including || 'Price includes all applicable taxes',
    excluding: staticConfig.help?.excluding || 'Tax will be calculated at checkout',
  };

  return normalized;
}

function getFallbackSettings() {
  const staticTax = APP_CONFIG.site?.tax || {};

  return {
    defaultRate: staticTax.defaultRate || 0,
    displayShop: staticTax.displayShop || 'including',
    displayCart: staticTax.displayCart || 'including',
    pricesIncludeTax: staticTax.pricesIncludeTax !== false,
    taxDisplayTotals: staticTax.taxDisplayTotals !== false,
    customSuffix: staticTax.customSuffix || '',
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
      customSuffix: staticTax.customSuffix || '',
    },
    help: staticTax.help || {
      including: 'Price includes all applicable taxes',
      excluding: 'Tax will be calculated at checkout',
    },
  };
}

export async function getMergedTaxConfig() {
  const backendSettings = await fetchTaxSettings();
  const staticConfig = APP_CONFIG.site?.tax || {};

  return {
    ...staticConfig,
    ...backendSettings,
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

export function isDynamicSettingsEnabled() {
  return APP_CONFIG.site?.tax?.dynamicSettings !== false;
}
