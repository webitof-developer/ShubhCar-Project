//src/services/productService.js

/**
 * Product Service - Config-Driven Architecture
 *
 * DATA SOURCE:
 * - Reads APP_CONFIG.dataSource.products via getDataSourceConfig()
 * - 'demo' = Use mock data from /data/products
 * - 'real' = Fetch from backend API /products
 * - Supports fallback modes: 'demo' | 'empty' | 'error'
 */

import APP_CONFIG, {
  getDataSourceConfig,
  logDataSource,
} from '@/config/app.config';
import { products as demoProducts } from '@/data/products';
import { resolveProductImages } from '@/utils/media';
import { getCategoryBySlug } from './categoryService';
import { api } from '@/utils/apiClient';
import { logger } from '@/utils/logger';

const isProd = process.env.NODE_ENV === 'production';

// Map frontend-friendly sort aliases -> backend enum values
// Backend accepts: created_desc | created_asc | price_asc | price_desc
const SORT_MAP = {
  newest: 'created_desc',
  oldest: 'created_asc',
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  created_desc: 'created_desc',
  created_asc: 'created_asc',
};

/** Resolve a sort string to the backend-accepted enum value, or undefined if unknown. */
const resolveSort = (sort) =>
  sort ? (SORT_MAP[sort] ?? undefined) : undefined;

const parseDateSafe = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeProductType = (value) => {
  const type = String(value || '').trim().toUpperCase();
  if (type === 'OEM' || type === 'OES' || type === 'AFTERMARKET') return type;
  return value;
};

const isDemoFlashDealActive = (product) => {
  if (!product?.isFlashDeal) return false;
  const now = new Date();
  const start = parseDateSafe(product.flashDealStartAt);
  const end = parseDateSafe(product.flashDealEndAt);
  if (!start || !end) return false;
  return start <= now && now <= end;
};


const normalizeProduct = (product) => {
  if (!product) return product;
  return {
    ...product,
    productType: normalizeProductType(product.productType),
    images: resolveProductImages(product.images || []),
  };
};

const normalizeProductList = (products = []) =>
  Array.isArray(products) ? products.map(normalizeProduct) : [];

const unwrapPayload = (payload) =>
  payload && typeof payload === 'object' && 'data' in payload
    ? payload.data
    : payload;

const getCategoryEntityId = (category) => {
  if (!category || typeof category !== 'object') return '';
  if (category._id) return String(category._id);
  if (category.id) return String(category.id);
  if (category.categoryCode) return String(category.categoryCode);
  return '';
};

/**
 * Apply fallback strategy
 */
const applyFallback = (fallback, demoData, domain, source) => {
  if (source === 'demo') {
    logDataSource(domain, 'DEMO', 'explicit demo mode');
    return Array.isArray(demoData)
      ? normalizeProductList(demoData)
      : normalizeProduct(demoData);
  }

  if (fallback === 'empty' && !isProd) {
    logDataSource(domain, 'EMPTY', 'fallback configured as empty');
    return Array.isArray(demoData) ? [] : null;
  }

  throw new Error(`${domain} fetch failed`);
};

// ==================== PUBLIC API ====================

export const getProducts = async ({
  page = 1,
  limit = 12,
  search,
  sort,
  categoryId,
  vehicleIds,
  productType,
  manufacturerBrand,
  isOnSale,
  isFeatured,
  isBestSeller,
  fetchOptions,
} = {}) => {
  const config = getDataSourceConfig('products');
  const hasVehicleFilter = Array.isArray(vehicleIds) && vehicleIds.length > 0;
  const onSale = isOnSale === 'true' || isOnSale === true;
  const featured = isFeatured === 'true' || isFeatured === true;
  const bestSeller = isBestSeller === 'true' || isBestSeller === true;

  if (config.source === 'demo') {
    logDataSource('PRODUCTS', 'DEMO');
    if (hasVehicleFilter) {
      return [];
    }
    let filtered = [...demoProducts];

    if (productType) {
      const types = String(productType)
        .split(',')
        .map((t) => t.trim());
      filtered = filtered.filter((p) => types.includes(p.productType));
    }

    if (manufacturerBrand) {
      filtered = filtered.filter(
        (p) =>
          p.manufacturerBrand?.toLowerCase() ===
          manufacturerBrand.toLowerCase(),
      );
    }

    if (onSale) {
      filtered = filtered.filter(
        (p) => isDemoFlashDealActive(p) || (
          p.retailPrice?.salePrice &&
          p.retailPrice?.mrp &&
          p.retailPrice.salePrice < p.retailPrice.mrp
        ),
      );
    }

    if (featured) {
      filtered = filtered.filter((p) => p.isFeatured);
    }

    if (bestSeller) {
      // Fallback: Use isBestSeller flag or productType in OEM/OES as proxy if flag missing in demo data
      filtered = filtered.filter(
        (p) => p.isBestSeller || p.productType === 'OEM' || p.productType === 'OES',
      );
    }

    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.manufacturerBrand?.toLowerCase().includes(query) ||
          p.oemNumber?.toLowerCase().includes(query) ||
          p.oesNumber?.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    if (sort === 'price-asc')
      filtered.sort(
        (a, b) => (a.vendor?.retailPrice || 0) - (b.vendor?.retailPrice || 0),
      );
    if (sort === 'price-desc')
      filtered.sort(
        (a, b) => (b.vendor?.retailPrice || 0) - (a.vendor?.retailPrice || 0),
      );
    if (sort === 'name-asc')
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sort === 'newest')
      filtered.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

    // Apply pagination
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return normalizeProductList(paginated);
  }

  // Real mode
  try {
    logDataSource('PRODUCTS', 'REAL');
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    const resolvedSort = resolveSort(sort);
    if (resolvedSort) params.set('sort', resolvedSort);
    if (categoryId) params.set('categoryId', String(categoryId));
    if (hasVehicleFilter) params.set('vehicle_id', vehicleIds.join(','));
    if (productType) params.set('productType', productType);
    if (manufacturerBrand) params.set('manufacturerBrand', manufacturerBrand);
    if (onSale) params.set('isOnSale', 'true');
    if (featured) params.set('isFeatured', 'true');
    if (bestSeller) params.set('isBestSeller', 'true');

    const url = `/products?${params.toString()}`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    return normalizeProductList(payload?.items || []);
  } catch (error) {
    const catchParams = new URLSearchParams();
    catchParams.set('page', String(page));
    catchParams.set('limit', String(limit));
    if (search) catchParams.set('search', search);
    const resolvedSortCatch = resolveSort(sort);
    if (resolvedSortCatch) catchParams.set('sort', resolvedSortCatch);
    if (categoryId) catchParams.set('categoryId', String(categoryId));
    if (hasVehicleFilter) catchParams.set('vehicle_id', vehicleIds.join(','));
    if (productType) catchParams.set('productType', productType);
    if (manufacturerBrand)
      catchParams.set('manufacturerBrand', manufacturerBrand);
    if (onSale) catchParams.set('isOnSale', 'true');
    if (featured) catchParams.set('isFeatured', 'true');
    if (bestSeller) catchParams.set('isBestSeller', 'true');
    const catchUrl = `/products?${catchParams.toString()}`;
    logger.error('[PRODUCT_SERVICE] getProducts failed:', {
      url: catchUrl,
      status: error.status,
      message: error.message || String(error),
      stack: error.stack,
    });
    return applyFallback(
      config.fallback,
      demoProducts,
      'PRODUCTS',
      config.source,
    );
  }
};

export const getProductsByCategory = async (categorySlug, options = {}) => {
  if (!categorySlug) return [];

  const config = getDataSourceConfig('products');
  const hasVehicleFilter =
    Array.isArray(options.vehicleIds) && options.vehicleIds.length > 0;
  let requestUrl = '';

  if (config.source === 'demo') {
    logDataSource('PRODUCTS', 'DEMO');
    if (hasVehicleFilter) {
      return [];
    }

    // Filter demo products by category
    let filtered = demoProducts.filter((p) => p.categorySlug === categorySlug);

    if (options.productType) {
      const types = String(options.productType)
        .split(',')
        .map((t) => t.trim());
      filtered = filtered.filter((p) => types.includes(p.productType));
    }

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 12;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return normalizeProductList(paginated);
  }

  // Real mode
  try {
    logDataSource('PRODUCTS', 'REAL');
    const category = await getCategoryBySlug(categorySlug);
    const resolvedCategoryId = getCategoryEntityId(category);
    if (!resolvedCategoryId) return [];

    const params = new URLSearchParams();
    params.set('page', String(options.page || 1));
    params.set('limit', String(options.limit || 12));
    params.set('categoryId', resolvedCategoryId);
    if (hasVehicleFilter)
      params.set('vehicle_id', options.vehicleIds.join(','));
    if (options.productType) params.set('productType', options.productType);

    const url = `/products?${params.toString()}`;
    requestUrl = url;
    const data = await api.get(url, options.fetchOptions);
    const payload = unwrapPayload(data);
    return normalizeProductList(payload?.items || []);
  } catch (error) {
    const url =
      requestUrl ||
      `/products?categorySlug=${encodeURIComponent(categorySlug)}`;
    logger.error('[PRODUCT_SERVICE] getProductsByCategory failed:', {
      url,
      message: error.message,
    });
    return applyFallback(
      config.fallback,
      demoProducts.filter((p) => p.categorySlug === categorySlug),
      'PRODUCTS',
      config.source,
    );
  }
};

export const searchProducts = async (query, options = {}) => {
  if (!query) return [];

  const config = getDataSourceConfig('products');
  const hasVehicleFilter =
    Array.isArray(options.vehicleIds) && options.vehicleIds.length > 0;

  if (config.source === 'demo') {
    logDataSource('PRODUCTS', 'DEMO');
    if (hasVehicleFilter) {
      return [];
    }
    const lowerQuery = query.toLowerCase();
    let filtered = demoProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.manufacturerBrand?.toLowerCase().includes(lowerQuery) ||
        p.oemNumber?.toLowerCase().includes(lowerQuery) ||
        p.oesNumber?.toLowerCase().includes(lowerQuery),
    );
    if (options.productType) {
      const types = String(options.productType)
        .split(',')
        .map((t) => t.trim());
      filtered = filtered.filter((p) => types.includes(p.productType));
    }

    return normalizeProductList(filtered);
  }

  // Real mode
  try {
    logDataSource('PRODUCTS', 'REAL');

    const params = new URLSearchParams();
    params.set('q', query);
    params.set('page', String(options.page || 1));
    params.set('limit', String(options.limit || 12));
    params.set('sort', 'relevance');

    if (hasVehicleFilter)
      params.set('vehicle_id', options.vehicleIds.join(','));
    if (options.productType) params.set('productType', options.productType);
    if (options.categoryId) params.set('categoryId', options.categoryId);
    if (options.manufacturerBrand)
      params.set('manufacturerBrand', options.manufacturerBrand);
    if (options.vehicleBrand) params.set('vehicleBrand', options.vehicleBrand);
    if (options.year) params.set('year', options.year);

    const url = `/products/search?${params.toString()}`;
    const data = await api.get(url, options.fetchOptions);
    const payload = unwrapPayload(data);
    return normalizeProductList(payload?.items || []);
  } catch (error) {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('page', String(options.page || 1));
    params.set('limit', String(options.limit || 12));
    params.set('sort', 'relevance');
    if (hasVehicleFilter)
      params.set('vehicle_id', options.vehicleIds.join(','));
    if (options.productType) params.set('productType', options.productType);
    if (options.categoryId) params.set('categoryId', options.categoryId);
    if (options.manufacturerBrand)
      params.set('manufacturerBrand', options.manufacturerBrand);
    if (options.vehicleBrand) params.set('vehicleBrand', options.vehicleBrand);
    if (options.year) params.set('year', options.year);
    const url = `/products/search?${params.toString()}`;
    logger.error('[PRODUCT_SERVICE] searchProducts failed:', {
      url,
      message: error.message,
    });
    const lowerQuery = query.toLowerCase();
    const demoResults = demoProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.manufacturerBrand?.toLowerCase().includes(lowerQuery) ||
        p.oemNumber?.toLowerCase().includes(lowerQuery) ||
        p.oesNumber?.toLowerCase().includes(lowerQuery),
    );
    return applyFallback(
      config.fallback,
      demoResults,
      'PRODUCTS',
      config.source,
    );
  }
};

export const searchCatalogProducts = async ({
  query,
  page = 1,
  limit = 20,
  categoryId,
  productType,
  manufacturerBrand,
  vehicleBrand,
  year,
  vehicleIds,
  sort = 'relevance',
  fetchOptions,
} = {}) => {
  const q = String(query || '').trim();
  if (!q) {
    return {
      items: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0,
      facets: {
        productTypes: [],
        manufacturerBrands: [],
        vehicleBrands: [],
        categories: [],
        years: [],
      },
    };
  }

  const config = getDataSourceConfig('products');
  const hasVehicleFilter = Array.isArray(vehicleIds) && vehicleIds.length > 0;

  if (config.source === 'demo') {
    const items = await searchProducts(q, {
      page,
      limit,
      productType,
      vehicleIds,
      fetchOptions,
    });
    return {
      items,
      total: items.length,
      page,
      limit,
      totalPages: items.length ? 1 : 0,
      facets: {
        productTypes: [],
        manufacturerBrands: [],
        vehicleBrands: [],
        categories: [],
        years: [],
      },
    };
  }

  try {
    const params = new URLSearchParams();
    params.set('q', q);
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('sort', sort);
    if (categoryId) params.set('categoryId', categoryId);
    if (productType) params.set('productType', productType);
    if (manufacturerBrand) params.set('manufacturerBrand', manufacturerBrand);
    if (vehicleBrand) params.set('vehicleBrand', vehicleBrand);
    if (year) params.set('year', year);
    if (hasVehicleFilter) params.set('vehicle_id', vehicleIds.join(','));

    const url = `/products/search?${params.toString()}`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data) || {};
    return {
      items: normalizeProductList(payload.items || []),
      total: Number(payload.total || 0),
      page: Number(payload.page || page),
      limit: Number(payload.limit || limit),
      totalPages: Number(payload.totalPages || 0),
      facets: payload.facets || {
        productTypes: [],
        manufacturerBrands: [],
        vehicleBrands: [],
        categories: [],
        years: [],
      },
    };
  } catch (error) {
    logger.error('[PRODUCT_SERVICE] searchCatalogProducts failed:', {
      message: error.message,
      status: error.status,
    });
    const fallbackItems = await searchProducts(q, {
      page,
      limit,
      productType,
      vehicleIds,
      fetchOptions,
    });
    return {
      items: fallbackItems,
      total: fallbackItems.length,
      page,
      limit,
      totalPages: fallbackItems.length ? 1 : 0,
      facets: {
        productTypes: [],
        manufacturerBrands: [],
        vehicleBrands: [],
        categories: [],
        years: [],
      },
    };
  }
};

export const getRelatedProducts = async (
  productId,
  limit = 4,
  fetchOptions,
) => {
  if (!productId) return [];

  const config = getDataSourceConfig('products');
  let requestUrl = '';

  if (config.source === 'demo') {
    logDataSource('PRODUCTS', 'DEMO');
    const product = demoProducts.find((p) => (p._id || p.id) === productId);
    if (!product) return [];

    const related = demoProducts.filter(
      (p) =>
        p.categorySlug === product.categorySlug &&
        (p._id || p.id) !== productId,
    );

    return normalizeProductList(related.slice(0, limit));
  }

  // Real mode
  try {
    logDataSource('PRODUCTS', 'REAL');
    const product = await getProductById(productId);
    if (!product?.categoryId) return [];

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(limit + 2));
    params.set('categoryId', product.categoryId);

    const url = `/products?${params.toString()}`;
    requestUrl = url;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    const items = payload?.items || [];
    const filtered = items.filter((p) => p._id !== productId).slice(0, limit);

    return normalizeProductList(filtered);
  } catch (error) {
    const url = requestUrl || `/products`;
    logger.error('[PRODUCT_SERVICE] getRelatedProducts failed:', {
      url,
      message: error.message,
    });
    return applyFallback(config.fallback, [], 'PRODUCTS', config.source);
  }
};

export const getFeaturedProducts = async (limit = 8, fetchOptions) => {
  const config = getDataSourceConfig('products');

  if (config.source === 'demo') {
    logDataSource('PRODUCTS', 'DEMO');
    // Return first N products as "featured" in demo mode
    return normalizeProductList(demoProducts.slice(0, limit));
  }

  // Real mode
  try {
    logDataSource('PRODUCTS', 'REAL');
    const params = new URLSearchParams();
    params.set('limit', String(limit));

    const url = `/product/featured?${params.toString()}`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    return normalizeProductList(payload || []);
  } catch (error) {
    const url = `/product/featured?${params.toString()}`;
    logger.error('[PRODUCT_SERVICE] getFeaturedProducts failed:', {
      url,
      message: error.message,
    });
    return applyFallback(
      config.fallback,
      demoProducts.slice(0, limit),
      'PRODUCTS',
      config.source,
    );
  }
};

export const getProductBySlug = async (slug, fetchOptions) => {
  if (!slug) return null;

  const config = getDataSourceConfig('products');

  if (config.source === 'demo') {
    logDataSource('PRODUCTS', 'DEMO');
    const product = demoProducts.find((p) => p.slug === slug);
    return normalizeProduct(product || null);
  }

  // Real mode
  try {
    logDataSource('PRODUCTS', 'REAL');
    const url = `/products/${slug}`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    return normalizeProduct(payload || null);
  } catch (error) {
    const url = `/products/${slug}`;
    logger.error('[PRODUCT_SERVICE] getProductBySlug failed:', {
      url,
      message: error.message,
    });
    const demoProduct = demoProducts.find((p) => p.slug === slug);
    return applyFallback(
      config.fallback,
      demoProduct || null,
      'PRODUCTS',
      config.source,
    );
  }
};

export const getProductById = async (id, fetchOptions) => {
  if (!id) return null;

  const config = getDataSourceConfig('products');
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(String(id));
  const silent = fetchOptions?.silent;

  if (config.source === 'demo') {
    logDataSource('PRODUCTS', 'DEMO');
    const product = demoProducts.find((p) => (p._id || p.id) === id);
    return normalizeProduct(product || null);
  }

  // Real mode
  try {
    if (!isValidObjectId) {
      const demoProduct = demoProducts.find((p) => (p._id || p.id) === id);
      if (demoProduct) return normalizeProduct(demoProduct);
      return config.fallback === 'empty' ? null : null;
    }
    logDataSource('PRODUCTS', 'REAL');
    const url = `/products/id/${id}`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    return normalizeProduct(payload || null);
  } catch (error) {
    const url = `/products/id/${id}`;
    if (!silent) {
      logger.error('[PRODUCT_SERVICE] getProductById failed:', {
        url,
        message: error.message,
      });
    }
    const demoProduct = demoProducts.find((p) => (p._id || p.id) === id);
    if (demoProduct) return normalizeProduct(demoProduct);
    return null;
  }
};

export const getProductCompatibility = async (productId, fetchOptions) => {
  if (!productId) return {};
  try {
    const url = `/products/id/${productId}/compatibility`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    return payload || {};
  } catch (error) {
    const url = `/products/id/${productId}/compatibility`;
    logger.error('[PRODUCT_SERVICE] getProductCompatibility failed:', {
      url,
      message: error.message,
    });
    if (isProd) throw error;
    return {};
  }
};

export const getProductAlternatives = async (productId, fetchOptions) => {
  if (!productId) return { oem: [], aftermarket: [] };
  try {
    const url = `/products/id/${productId}/alternatives`;
    const data = await api.get(url, fetchOptions);
    const payload = unwrapPayload(data);
    const oemRaw = payload?.oem || payload?.OEM || payload?.oemAlternatives || [];
    const aftermarketRaw =
      payload?.aftermarket || payload?.AFTERMARKET || payload?.aftermarketAlternatives || [];
    return {
      oem: normalizeProductList(oemRaw),
      aftermarket: normalizeProductList(aftermarketRaw),
    };
  } catch (error) {
    const url = `/products/id/${productId}/alternatives`;
    logger.error('[PRODUCT_SERVICE] getProductAlternatives failed:', {
      url,
      message: error.message,
    });
    if (isProd) throw error;
    return { oem: [], aftermarket: [] };
  }
};

