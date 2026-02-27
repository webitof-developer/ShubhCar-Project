//src/services/categoryService.js

/**
 * Category Service - Config-Driven Architecture
 * 
 * DATA SOURCE:
 * - Reads APP_CONFIG.dataSource.categories via getDataSourceConfig()
 * - 'demo' = Use mock data from /data/categories
 * - 'real' = Fetch from backend API /categories
 * - Supports fallback modes: 'demo' | 'empty' | 'error'
 */

import APP_CONFIG, { getDataSourceConfig, logDataSource } from '@/config/app.config';
import { categories as demoCategories } from '@/data/categories';
import { api } from '@/utils/apiClient';

const baseUrl = APP_CONFIG.api.baseUrl;
const isProd = process.env.NODE_ENV === 'production';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = {
  hierarchy: { value: null, expiresAt: 0 },
  roots: { value: null, expiresAt: 0 },
  children: new Map(),
  bySlug: new Map(),
};

const readCache = (entry) => (entry && entry.expiresAt > Date.now() ? entry.value : null);
const writeCache = (entry, value) => {
  entry.value = value;
  entry.expiresAt = Date.now() + CACHE_TTL_MS;
};
const unwrapPayload = (payload) =>
  payload && typeof payload === 'object' && 'data' in payload
    ? payload.data
    : payload;

// ==================== PRIVATE HELPERS ====================

/**
 * Apply fallback strategy
 */
const applyFallback = (fallback, demoData, domain, source) => {
  if (source === 'demo') {
    logDataSource(domain, 'DEMO', 'explicit demo mode');
    return demoData;
  }

  if (fallback === 'empty' && !isProd) {
    logDataSource(domain, 'EMPTY', 'fallback configured as empty');
    return Array.isArray(demoData) ? [] : null;
  }

  throw new Error(`${domain} fetch failed`);
};

// ==================== PUBLIC API ====================

export const getCategories = async (fetchOptions) => {
  const config = getDataSourceConfig('categories');
  const cached = readCache(cache.hierarchy);
  if (cached) return cached;
  
  if (config.source === 'demo') {
    logDataSource('CATEGORIES', 'DEMO');
    // Build hierarchy from flat demo data
    const rootCategories = demoCategories.filter(cat => !cat.parentId);
    const buildHierarchy = (parentId) => {
      return demoCategories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          ...cat,
          children: buildHierarchy(cat.id)
        }));
    };
    
    const result = rootCategories.map(cat => ({
      ...cat,
      children: buildHierarchy(cat.id)
    }));
    writeCache(cache.hierarchy, result);
    return result;
  }
  
  // Real mode
  try {
    logDataSource('CATEGORIES', 'REAL');
    const url = `${baseUrl}/categories/hierarchy`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    const result = payload || [];
    writeCache(cache.hierarchy, result);
    return result;
  } catch (error) {
    const url = `${baseUrl}/categories/hierarchy`;
    console.error('[CATEGORY_SERVICE] getCategories failed:', { url, message: error.message });
    return applyFallback(config.fallback, demoCategories, 'CATEGORIES', config.source);
  }
};

export const getRootCategories = async (fetchOptions) => {
  const config = getDataSourceConfig('categories');
  const cached = readCache(cache.roots);
  if (cached) return cached;
  
  if (config.source === 'demo') {
    logDataSource('CATEGORIES', 'DEMO');
    const result = demoCategories.filter(cat => !cat.parentId);
    writeCache(cache.roots, result);
    return result;
  }
  
  // Real mode
  try {
    logDataSource('CATEGORIES', 'REAL');
    const url = `${baseUrl}/categories/roots`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    const result = payload || [];
    writeCache(cache.roots, result);
    return result;
  } catch (error) {
    const url = `${baseUrl}/categories/roots`;
    console.error('[CATEGORY_SERVICE] getRootCategories failed:', { url, message: error.message });
    return applyFallback(config.fallback, demoCategories.filter(cat => !cat.parentId), 'CATEGORIES', config.source);
  }
};

export const getChildCategories = async (parentId, fetchOptions) => {
  if (!parentId) return [];
  
  const config = getDataSourceConfig('categories');
  const cachedEntry = cache.children.get(parentId);
  const cached = cachedEntry && cachedEntry.expiresAt > Date.now() ? cachedEntry.value : null;
  if (cached) return cached;
  
  if (config.source === 'demo') {
    logDataSource('CATEGORIES', 'DEMO');
    const result = demoCategories.filter(cat => cat.parentId === parentId);
    cache.children.set(parentId, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }
  
  // Real mode
  try {
    logDataSource('CATEGORIES', 'REAL');
    const url = `${baseUrl}/categories/children/${parentId}`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    const result = payload || [];
    cache.children.set(parentId, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (error) {
    const url = `${baseUrl}/categories/children/${parentId}`;
    console.error('[CATEGORY_SERVICE] getChildCategories failed:', { url, message: error.message });
    return applyFallback(config.fallback, demoCategories.filter(cat => cat.parentId === parentId), 'CATEGORIES', config.source);
  }
};

export const getCategoryBySlug = async (slug, fetchOptions) => {
  if (!slug) return null;
  
  const config = getDataSourceConfig('categories');
  const slugKey = String(slug);
  const cachedEntry = cache.bySlug.get(slugKey);
  const cached = cachedEntry && cachedEntry.expiresAt > Date.now() ? cachedEntry.value : null;
  if (cached) return cached;
  
  if (config.source === 'demo') {
    logDataSource('CATEGORIES', 'DEMO');
    const result = demoCategories.find(cat => cat.slug === slug) || null;
    cache.bySlug.set(slugKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }
  
  // Real mode
  try {
    logDataSource('CATEGORIES', 'REAL');
    const url = `${baseUrl}/categories/${slug}`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    const result = payload || null;
    cache.bySlug.set(slugKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (error) {
    const url = `${baseUrl}/categories/${slug}`;
    console.error('[CATEGORY_SERVICE] getCategoryBySlug failed:', { url, message: error.message });
    return applyFallback(config.fallback, demoCategories.find(cat => cat.slug === slug) || null, 'CATEGORIES', config.source);
  }
};

export const getCategoryBreadcrumb = async (slug) => {
  if (!slug) return [];
  
  const config = getDataSourceConfig('categories');
  
  // Get all categories (will respect config internally)
  const hierarchy = await getCategories();
  const flat = new Map();
  const stack = Array.isArray(hierarchy) ? [...hierarchy] : [];

  // Flatten hierarchy
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    flat.set(String(node._id || node.id), node);
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => stack.push(child));
    }
  }

  // Find target category
  const target = Array.from(flat.values()).find((cat) => cat.slug === slug);
  if (!target) return [];

  // Build breadcrumb trail
  const breadcrumb = [];
  let current = target;
  while (current) {
    breadcrumb.unshift(current);
    if (!current.parentId) break;
    current = flat.get(String(current.parentId));
  }
  
  return breadcrumb;
};
