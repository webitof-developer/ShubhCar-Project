// src/utils/storage.js
/**
 * Cookie-based storage wrapper (replaces localStorage).
 *
 * Uses js-cookie as primary layer, with in-memory fallback for:
 *  - SSR (server side where `document` is unavailable)
 *  - Environments where cookies are blocked
 *
 * Exported API is identical to the old localStorage wrapper so all
 * callers (AuthContext, CartContext, etc.) need zero changes.
 *
 * Cookie options:
 *  - expires : 7 days
 *  - sameSite: 'Lax'
 *  - secure  : true in production (HTTPS)
 */

import Cookies from 'js-cookie';

// In-memory fallback for SSR / cookie-blocked environments
const memoryStorage = new Map();

const isBrowser = () => typeof window !== 'undefined';

const COOKIE_OPTIONS = {
  expires: 7,          // days
  sameSite: 'Lax',
  // Only set Secure flag in production HTTPS
  ...(isBrowser() && window.location.protocol === 'https:' ? { secure: true } : {}),
};

/* ── Helpers ───────────────────────────────────────────────────────────── */

const serializeValue = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const deserializeValue = (raw) => {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // Return as-is if it's already a plain string
  }
};

/* ── Public API ────────────────────────────────────────────────────────── */

/**
 * Get an item from cookie storage.
 * Returns the parsed value or null.
 */
export const getStorageItem = (key) => {
  try {
    if (isBrowser()) {
      const raw = Cookies.get(key);
      if (raw !== undefined) return deserializeValue(raw);
    }
    // SSR / cookie unavailable: fall back to in-memory
    return memoryStorage.get(key) ?? null;
  } catch (error) {
    console.warn(`[Storage] Failed to get "${key}":`, error);
    return memoryStorage.get(key) ?? null;
  }
};

/**
 * Set an item in cookie storage.
 */
export const setStorageItem = (key, value) => {
  try {
    const serialized = serializeValue(value);
    if (isBrowser()) {
      Cookies.set(key, serialized, COOKIE_OPTIONS);
    }
    // Always mirror to memory (instant reads without parse overhead)
    memoryStorage.set(key, value);
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to set "${key}":`, error);
    memoryStorage.set(key, value);
    return false;
  }
};

/**
 * Remove an item from cookie storage.
 */
export const removeStorageItem = (key) => {
  try {
    if (isBrowser()) {
      Cookies.remove(key);
    }
    memoryStorage.delete(key);
    return true;
  } catch (error) {
    console.warn(`[Storage] Failed to remove "${key}":`, error);
    memoryStorage.delete(key);
    return false;
  }
};

/**
 * Clear ALL app cookies (only those managed by this wrapper).
 * Note: Cookies.clear() doesn't exist in js-cookie — we track known keys.
 */
const MANAGED_KEYS = [
  'accessToken',
  'refreshToken',
  'user',
  'cart_items',
  'applied_coupon',
  'vehicleSelection',
];

export const clearStorage = () => {
  try {
    if (isBrowser()) {
      MANAGED_KEYS.forEach((k) => Cookies.remove(k));
    }
    memoryStorage.clear();
    return true;
  } catch (error) {
    console.warn('[Storage] Failed to clear storage:', error);
    memoryStorage.clear();
    return false;
  }
};
