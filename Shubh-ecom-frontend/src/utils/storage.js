//src/utils/storage.js

/**
 * Safe localStorage wrapper with SSR guards and fallbacks
 * Prevents Next.js hydration errors and provides in-memory fallback
 */

// In-memory fallback for SSR or when localStorage is unavailable
const memoryStorage = new Map();

/**
 * Check if we're in a browser environment
 */
const isBrowser = () => typeof window !== 'undefined';

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = () => {
  if (!isBrowser()) return false;
  
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Safely get item from storage
 */
export const getStorageItem = (key) => {
  try {
    if (isLocalStorageAvailable()) {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    // Fallback to memory storage
    return memoryStorage.get(key) || null;
  } catch (error) {
    console.warn(`[Storage] Failed to get item "${key}":`, error);
    return memoryStorage.get(key) || null;
  }
};

/**
 * Safely set item in storage
 */
export const setStorageItem = (key, value) => {
  try {
    const serialized = JSON.stringify(value);
    
    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(key, serialized);
    }
    // Always keep in memory as backup
    memoryStorage.set(key, value);
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to set item "${key}":`, error);
    // Still try to save in memory
    memoryStorage.set(key, value);
    return false;
  }
};

/**
 * Safely remove item from storage
 */
export const removeStorageItem = (key) => {
  try {
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(key);
    }
    memoryStorage.delete(key);
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to remove item "${key}":`, error);
    memoryStorage.delete(key);
    return false;
  }
};

/**
 * Safely clear all storage
 */
export const clearStorage = () => {
  try {
    if (isLocalStorageAvailable()) {
      window.localStorage.clear();
    }
    memoryStorage.clear();
    return true;
  } catch (error) {
    console.warn('[Storage] Failed to clear storage:', error);
    memoryStorage.clear();
    return false;
  }
};
