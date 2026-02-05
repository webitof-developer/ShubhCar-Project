//src/services/userAddressService.js

/**
 * User Address Service - PHASE 8
 * 
 * DATA SOURCE:
 * - Reads APP_CONFIG.dataSource.profile.address via getDataSourceConfig()
 * - 'demo' = Use localStorage persistence with demo data
 * - 'real' = Fetch from backend API /users/addresses
 * - Supports fallback modes: 'demo' | 'empty' | 'error'
 * 
 * NOTE: Real backend fetch logic is DORMANT until config is switched to 'real'.
 * Currently config is set to 'demo', so all backend calls are skipped.
 */

import APP_CONFIG, { getDataSourceConfig, logDataSource } from '@/config/app.config';
import { handleDataSourceFallback } from '@/utils/dataSourceFallback';

// Demo user data
const DEMO_USER = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+91 98765 43210'
};

// Demo addresses - REMOVED: No static data
const DEMO_ADDRESSES = [];

const STORAGE_KEY = 'user_addresses';
const USER_KEY = 'current_user';

// ==================== PRIVATE HELPERS (Demo Mode) ====================

/**
 * Initialize addresses in localStorage if not present
 */
const initializeAddresses = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_ADDRESSES));
  }
  if (!localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, JSON.stringify(DEMO_USER));
  }
};

/**
 * Get addresses from localStorage (demo mode)
 */
const getDemoAddresses = () => {
  if (typeof window === 'undefined') return DEMO_ADDRESSES;
  initializeAddresses();
  const addresses = localStorage.getItem(STORAGE_KEY);
  return addresses ? JSON.parse(addresses) : DEMO_ADDRESSES;
};

// ==================== BACKEND API HELPERS (Real Mode - DORMANT) ====================

/**
 * Fetch addresses from backend API
 * @param {string} accessToken - Auth token
 * @returns {Promise<Array>} - Array of addresses
 */
const fetchRealAddresses = async (accessToken) => {
  if (!accessToken) {
    console.warn('[ADDRESS_SERVICE] No access token for real fetch');
    return null;
  }

  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}/user-addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('[ADDRESS_SERVICE] Address fetch failed:', response.status);
      return null;
    }

    const json = await response.json();
    // Backend returns: {success: true, data: [...]}
    return json?.data || json?.addresses || [];
  } catch (error) {
    console.error('[ADDRESS_SERVICE] Address fetch error:', error);
    return null;
  }
};

/**
 * Add address via backend API
 */
const addRealAddress = async (accessToken, addressData) => {
  if (!accessToken) return null;

  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}/user-addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) return null;

    const json = await response.json();
    // Backend returns: {success: true, data: {...}}
    return json?.data || json?.address || null;
  } catch (error) {
    console.error('[ADDRESS_SERVICE] Add address error:', error);
    return null;
  }
};

/**
 * Update address via backend API
 */
const updateRealAddress = async (accessToken, id, addressData) => {
  if (!accessToken) return null;

  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}/user-addresses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) return null;

    const json = await response.json();
    // Backend returns: {success: true, data: {...}}
    return json?.data || json?.address || null;
  } catch (error) {
    console.error('[ADDRESS_SERVICE] Update address error:', error);
    return null;
  }
};

/**
 * Delete address via backend API
 */
const deleteRealAddress = async (accessToken, id) => {
  if (!accessToken) return false;

  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}/user-addresses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[ADDRESS_SERVICE] Delete address error:', error);
    return false;
  }
};

// ==================== PUBLIC API ====================

/**
 * Get current user
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return DEMO_USER;
  initializeAddresses();
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : DEMO_USER;
};

/**
 * Get all addresses for current user
 * PHASE 8: Now supports both demo and real backend fetch
 */
export const getUserAddresses = async (accessToken = null) => {
  const config = getDataSourceConfig('profile.address');

  // Demo mode: return localStorage data
  if (config.source === 'demo') {
    logDataSource('PROFILE.ADDRESS', 'DEMO', 'backend call skipped');
    return getDemoAddresses();
  }

  // Real mode: Fetch from backend
  logDataSource('PROFILE.ADDRESS', 'REAL');
  try {
    const addresses = await fetchRealAddresses(accessToken);
    
    if (!addresses || addresses.length === 0) {
      return handleDataSourceFallback('PROFILE.ADDRESS', config.fallback, []);
    }
    
    return addresses;
  } catch (error) {
    return handleDataSourceFallback('PROFILE.ADDRESS', config.fallback, [], error);
  }
};

/**
 * Get default address
 */
export const getDefaultAddress = async (accessToken = null) => {
  const addresses = await getUserAddresses(accessToken);
  return addresses.find(addr => addr.isDefault) || addresses[0] || null;
};

/**
 * Get address by ID
 */
export const getAddressById = async (id, accessToken = null) => {
  const addresses = await getUserAddresses(accessToken);
  return addresses.find(addr => (addr._id || addr.id) === id) || null;
};

/**
 * Add new address
 * PHASE 8: Now supports both demo and real backend
 */
export const addAddress = async (addressData, accessToken = null) => {
  const config = getDataSourceConfig('profile.address');

  // Demo mode: localStorage
  if (config.source === 'demo') {
    logDataSource('PROFILE.ADDRESS', 'DEMO', 'add via localStorage');
    const addresses = getDemoAddresses();
    const newAddress = {
      id: `addr-${Date.now()}`,
      ...addressData,
      isDefault: addresses.length === 0 ? true : (addressData.isDefault || false)
    };

    // If this is set as default, unset others
    if (newAddress.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }

    addresses.push(newAddress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    return newAddress;
  }

  // Real mode: Backend API
  logDataSource('PROFILE.ADDRESS', 'REAL', 'adding address');
  try {
    const newAddress = await addRealAddress(accessToken, addressData);
    
    if (!newAddress) {
      return handleDataSourceFallback('PROFILE.ADDRESS', config.fallback, null);
    }
    
    return newAddress;
  } catch (error) {
    return handleDataSourceFallback('PROFILE.ADDRESS', config.fallback, null, error);
  }
};

/**
 * Update existing address
 * PHASE 8: Now supports both demo and real backend
 */
export const updateAddress = async (id, addressData, accessToken = null) => {
  const config = getDataSourceConfig('profile.address');

  // Demo mode: localStorage
  if (config.source === 'demo') {
    logDataSource('PROFILE.ADDRESS', 'DEMO', 'update via localStorage');
    const addresses = getDemoAddresses();
    const index = addresses.findIndex(addr => addr.id === id);
    
    if (index === -1) return null;

    // If setting as default, unset others
    if (addressData.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }

    addresses[index] = {
      ...addresses[index],
      ...addressData
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    return addresses[index];
  }

  // Real mode: Backend API
  logDataSource('PROFILE.ADDRESS', 'REAL', 'updating address');
  try {
    const updatedAddress = await updateRealAddress(accessToken, id, addressData);
    
    if (!updatedAddress) {
      return handleDataSourceFallback('PROFILE.ADDRESS', config.fallback, null);
    }
    
    return updatedAddress;
  } catch (error) {
    return handleDataSourceFallback('PROFILE.ADDRESS', config.fallback, null, error);
  }
};

/**
 * Delete address
 * PHASE 8: Now supports both demo and real backend
 */
export const deleteAddress = async (id, accessToken = null) => {
  const config = getDataSourceConfig('profile.address');

  // Demo mode: localStorage
  if (config.source === 'demo') {
    logDataSource('PROFILE.ADDRESS', 'DEMO', 'delete via localStorage');
    const addresses = getDemoAddresses();
    const filtered = addresses.filter(addr => addr.id !== id);
    
    // If deleted address was default, set first address as default
    const wasDefault = addresses.find(addr => addr.id === id)?.isDefault;
    if (wasDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  // Real mode: Backend API
  logDataSource('PROFILE.ADDRESS', 'REAL', 'deleting address');
  try {
    const success = await deleteRealAddress(accessToken, id);
    
    if (!success) {
      // For delete, fallback 'error' should throw
      if (config.fallback === 'error') {
        throw new Error('Failed to delete address');
      }
      return false;
    }
    
    return true;
  } catch (error) {
    if (config.fallback === 'error') {
      throw error;
    }
    return false;
  }
};

/**
 * Set address as default (PHASE 12: Frontend-Only Default Logic)
 * 
 * Strategy:
 * 1. Fetch all addresses
 * 2. Update target address with isDefault: true
 * 3. Update all other addresses with isDefault: false
 * 
 * @param {string} id - Address ID
 * @param {string} accessToken - Auth token
 * @returns {Promise<object|null>} - Updated address or null
 */
export const setDefaultAddress = async (id, accessToken = null) => {
  const config = getDataSourceConfig('profile.address');

  // Demo mode: localStorage
  if (config.source === 'demo') {
    logDataSource('PROFILE.ADDRESS', 'DEMO', 'set default via localStorage');
    const addresses = getDemoAddresses();
    addresses.forEach(addr => {
      addr.isDefault = addr.id === id;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    return addresses.find(addr => addr.id === id);
  }

  // Real mode: Multiple PUT requests (Frontend-only logic)
  logDataSource('PROFILE.ADDRESS', 'REAL', 'setting default (frontend logic: multiple PUTs)');
  try {
    // Step 1: Fetch all addresses
    const addresses = await fetchRealAddresses(accessToken);
    
    if (!addresses || addresses.length === 0) {
      console.error('[ADDRESS_SERVICE] No addresses found');
      return null;
    }
    
    // Step 2: Find target address
    const targetAddress = addresses.find(a => (a._id || a.id) === id);
    if (!targetAddress) {
      console.error('[ADDRESS_SERVICE] Address not found:', id);
      return null;
    }
    
    // Step 3: Update target address with isDefaultShipping: true
    console.log('[ADDRESS_SERVICE] Setting as default:', id);
    const updated = await updateRealAddress(accessToken, id, {
      ...targetAddress,
      isDefaultShipping: true,
      isDefaultBilling: true
    });
    
    // Step 4: Update all other currently-default addresses with isDefaultShipping: false
    const others = addresses.filter(a => {
      const addrId = a._id || a.id;
      return addrId !== id && a.isDefaultShipping === true;
    });
    
    console.log('[ADDRESS_SERVICE] Unsetting default for', others.length, 'addresses');
    for (const addr of others) {
      const addrId = addr._id || addr.id;
      await updateRealAddress(accessToken, addrId, {
        ...addr,
        isDefaultShipping: false,
        isDefaultBilling: false
      });
    }
    
    return updated;
  } catch (error) {
    console.error('[ADDRESS_SERVICE] Set default error:', error);
    return null;
  }
};

/**
 * Validate address data
 */
export const validateAddress = (addressData) => {
  const errors = {};

  if (!addressData.fullName || addressData.fullName.trim() === '') {
    errors.fullName = 'Full name is required';
  }

  if (!addressData.phone || addressData.phone.trim() === '') {
    errors.phone = 'Phone number is required';
  }

  if (!addressData.address || addressData.address.trim() === '') {
    errors.address = 'Address is required';
  }

  if (!addressData.city || addressData.city.trim() === '') {
    errors.city = 'City is required';
  }

  if (!addressData.state || addressData.state.trim() === '') {
    errors.state = 'State is required';
  }

  if (!addressData.pincode || addressData.pincode.trim() === '') {
    errors.pincode = 'Pincode is required';
  } else if (!/^\d{6}$/.test(addressData.pincode)) {
    errors.pincode = 'Invalid pincode format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ============================================================================
// EXPORT ALIASES (for backward compatibility)
// ============================================================================

/**
 * Alias for getUserAddresses - used by AddressStep component
 */
export const getAddresses = getUserAddresses;

/**
 * Alias for addAddress - used by AddressStep component
 */
export const createAddress = addAddress;
