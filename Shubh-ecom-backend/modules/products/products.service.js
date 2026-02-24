//products.service.js
const repo = require('./product.repo');
const cache = require('../../cache/product.cache');
const { error } = require('../../utils/apiResponse');
const slugify = require('slugify');
const sanitize = require('../../utils/sanitizeHtml');
const ProductImage = require('../../models/ProductImage.model');
const Media = require('../../models/Media.model');
const cacheKeys = require('../../lib/cache/keys');
const { deletePatterns } = require('../../lib/cache/invalidate');
const ROLES = require('../../constants/roles');
const Category = require('../../models/Category.model');
const Brand = require('../../models/Brand.model');
const Product = require('../../models/Product.model');
const logger = require('../../config/logger');
const { getStorageSettings } = require('../../utils/storageSettings');
const s3 = require('../../utils/s3');
const fs = require('fs/promises');
const { generateProductCode } = require('../../utils/numbering');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');

const PRODUCT_CODE_REGEX = /^PRO-\d{6}$/;

const normalizeProductFields = (product) => {
  if (!product) return product;
  const legacyType = product.type;
  const legacyBrand = product.brand;
  const legacyOem = product.oemPartNumber;

  const rawType = product.productType || legacyType || 'AFTERMARKET';
  const productType = String(rawType).toUpperCase() === 'AFTERMARKET' ? 'AFTERMARKET' : 'OEM';
  const normalized = {
    ...product,
    productType,
    manufacturerBrand: product.manufacturerBrand || legacyBrand || null,
    oemNumber: product.oemNumber || legacyOem || null,
  };

  if (!normalized.vehicleBrand) normalized.vehicleBrand = null;

  // Ensure mutually exclusive identifiers
  if (productType === 'OEM') {
    normalized.manufacturerBrand = null;
  } else if (productType === 'AFTERMARKET') {
    normalized.vehicleBrand = null;
    normalized.oemNumber = null;
  }

  // Strip legacy/removed fields from API responses
  delete normalized.type;
  delete normalized.brand;
  delete normalized.oemPartNumber;
  delete normalized.compatibilityNotes;
  delete normalized.fulfilledBySubh;
  delete normalized.freeDelivery;

  return normalized;
};

const normalizeProductList = (products = []) =>
  Array.isArray(products) ? products.map(normalizeProductFields) : [];

const ensureListProductCodes = async (products = []) => {
  const missing = products.filter((item) => !item.productId || !PRODUCT_CODE_REGEX.test(item.productId));
  if (!missing.length) return;

  const existingCodes = await Product.find({ productId: { $ne: null } })
    .select('productId')
    .lean();
  const used = new Set(existingCodes.map((item) => item.productId));
  const updates = [];

  for (const product of missing) {
    let next = await generateProductCode();
    while (used.has(next)) {
      next = await generateProductCode();
    }
    used.add(next);
    product.productId = next;
    updates.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { productId: next } },
      },
    });
  }

  if (updates.length) {
    await Product.bulkWrite(updates, { ordered: false });
  }
};

const ensureProductTypeFields = ({ productType, vehicleBrand, oemNumber, manufacturerBrand }) => {
  if (!productType) error('Product type is required', 400);

  if (productType === 'OEM') {
    if (!String(vehicleBrand || '').trim()) error('Vehicle brand is required for OEM products', 400);
    if (!String(oemNumber || '').trim()) error('OEM number is required for OEM products', 400);
  }

  if (productType === 'AFTERMARKET') {
    if (!String(manufacturerBrand || '').trim()) error('Manufacturer brand is required for Aftermarket products', 400);
  }
};

class ProductService {
  async getBySlug(slug, user) {
    const cacheKey = cache.key.bySlug({ slug, user });
    const cached = await cache.get(cacheKey);
    if (cached) return this.applyPricing(cached, user);

    const product = await repo.findBySlugActive(slug);
    if (!product) error('Product not found', 404);

    const normalized = normalizeProductFields(product);
    await cache.setDetail(cacheKey, normalized);
    const enriched = await this.attachAggregateRatings(normalized);
    const withImages = await this.attachImages([enriched]);
    const withAttrs = await this.attachAttributes(withImages[0]);
    const withBrand = await this.attachBrandDetails(withAttrs);
    const withCategories = await this.attachCategoryHierarchy(withBrand);
    return this.applyPricing(withCategories, user);
  }

  async getByIdPublic(id, user) {
    const product = await repo.findByIdActive(id);
    if (!product) error('Product not found', 404);
    const enriched = await this.attachAggregateRatings(normalizeProductFields(product));
    const withImages = await this.attachImages([enriched]);
    const withBrand = await this.attachBrandDetails(withImages[0]);
    return this.applyPricing(withBrand, user);
  }

  async listByCategory(categoryId, options, user) {
    const { page = 1, limit = 20, cursor, sort = 'created_desc', filters } =
      options;

    const cacheKey = cache.key.listByCategory({
      categoryId,
      page,
      limit,
      cursor,
      sort,
      filters,
    });

    const cached = await cache.get(cacheKey);
    if (cached) return this.applyPricingList(cached, user);

    const data = await repo.listByCategory(categoryId, { limit, cursor });
    const enriched = await Promise.all(
      normalizeProductList(data).map((p) => this.attachAggregateRatings(p)),
    );
    const withImages = await this.attachImages(enriched);
    await cache.setList(cacheKey, withImages);

    return this.applyPricingList(withImages, user);
  }

  async listFeatured(options, user) {
    const { page = 1, limit = 20, cursor } = options;

    const cacheKey = cache.key.featured({ page, limit, cursor });

    const cached = await cache.get(cacheKey);
    if (cached) return this.applyPricingList(cached, user);

    const data = await repo.listFeatured({ limit, cursor });
    const enriched = await Promise.all(
      normalizeProductList(data).map((p) => this.attachAggregateRatings(p)),
    );
    const withImages = await this.attachImages(enriched);
    await cache.setList(cacheKey, withImages);

    return this.applyPricingList(withImages, user);
  }

  async listPublic(query = {}, user) {
    const { page = 1, limit = 20, search, categoryId, manufacturerBrand, productType, minPrice, maxPrice, sort } = query;
    const { items, total, page: safePage, limit: safeLimit } = await repo.listPublic({
      page,
      limit,
      search: search || undefined,
      categoryId,
      manufacturerBrand,
      productType,
      minPrice,
      maxPrice,
      sort,
    });
    const enriched = await Promise.all(
      normalizeProductList(items).map((p) => this.attachAggregateRatings(p)),
    );
    const withImages = await this.attachImages(enriched);
    return {
      items: this.applyPricingList(withImages, user),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async attachImages(products = []) {
    if (!products.length) return products;
    const productIds = products.map((p) => p._id);
    const images = await ProductImage.find({ productId: { $in: productIds }, isDeleted: false })
      .sort({ isPrimary: -1, sortOrder: 1 })
      .lean();
    const imageMap = new Map();
    images.forEach((img) => {
      const key = String(img.productId);
      if (!imageMap.has(key)) {
        imageMap.set(key, []);
      }
      imageMap.get(key).push({ url: img.url, altText: img.altText });
    });
    return products.map((product) => ({
      ...product,
      images: imageMap.get(String(product._id)) || [],
    }));
  }

  async adminGetById(productId) {
    const product = await repo.findById(productId);
    if (!product) error('Product not found', 404);

    // Enrich with category details (parent for UI preselection)
    const category =
      product.categoryId && (await Category.findById(product.categoryId).lean());

    return {
      ...normalizeProductFields(product),
      categoryMeta: category
        ? { _id: category._id, parentId: category.parentId }
        : null,
    };
  }
  async create(payload, user) {
    if (!user) error('Unauthorized', 401);
    if (user.role !== ROLES.ADMIN) error('Forbidden', 403);

    const productCode = payload.productCode
      ? String(payload.productCode).trim().toUpperCase()
      : null;
    const productCodeRegex = /^PRO-\d{6}$/;

    const slug =
      payload.slug ||
      slugify(payload.name, { lower: true, strict: true, trim: true });

    const exists = await repo.findAnyBySlug(slug);
    if (exists) error('Slug already exists', 409);

    const { images = [], ...safePayload } = payload;

    if (productCode) {
      if (!productCodeRegex.test(productCode)) {
        error('productCode must be in format PRO-000001', 400);
      }
      const existingCode = await Product.findOne({ productId: productCode }).lean();
      if (existingCode) error('productCode already exists', 409);
      safePayload.productId = productCode;
    }
    ensureProductTypeFields({
      productType: safePayload.productType,
      vehicleBrand: safePayload.vehicleBrand,
      oemNumber: safePayload.oemNumber,
      manufacturerBrand: safePayload.manufacturerBrand,
    });
    if (safePayload.productType === 'OEM') {
      safePayload.manufacturerBrand = null;
    }
    if (safePayload.productType === 'AFTERMARKET') {
      safePayload.vehicleBrand = null;
      safePayload.oemNumber = null;
    }
    [
      'shortDescription',
      'longDescription',
      'returnPolicy',
      'warrantyInfo',
    ].forEach((field) => {
      if (safePayload[field]) safePayload[field] = sanitize(safePayload[field]);
    });

    const product = await repo.create({
      ...safePayload,
      slug,
      status: safePayload.status && user.role === ROLES.ADMIN ? safePayload.status : 'draft',
      listingFeeStatus: 'waived',
    });

    if (images.length) {
      const formatted = images.map((img, index) => ({
        productId: product._id,
        url: img.url,
        altText: img.altText || product.name,
        isPrimary: index === 0,
        sortOrder: index,
      }));

      await ProductImage.insertMany(formatted);
    }

    await cache.invalidateProduct(slug);
    await cache.invalidateLists();
    await deletePatterns([cacheKeys.catalog.product(slug), 'catalog:products:*']);
    return product;
  }

  async update(productId, payload, user) {
    if (!user) error('Unauthorized', 401);

    const product = await repo.findById(productId);
    if (!product) error('Product not found', 404);



    // slug uniqueness if changing
    const oldSlug = product.slug;
    if (payload.slug && payload.slug !== product.slug) {
      const exists = await repo.findAnyBySlug(payload.slug);
      if (exists) error('Slug already exists', 409);
    }



    const { primaryImageId, ...safePayload } = payload;
    [
      'shortDescription',
      'longDescription',
      'returnPolicy',
      'warrantyInfo',
    ].forEach((field) => {
      if (safePayload[field]) safePayload[field] = sanitize(safePayload[field]);
    });

    const typeFieldsTouched = ['productType', 'vehicleBrand', 'oemNumber', 'manufacturerBrand', 'hlaapNo']
      .some((field) => Object.prototype.hasOwnProperty.call(safePayload, field));

    if (typeFieldsTouched) {
      const nextType = safePayload.productType || product.productType || product.type || 'AFTERMARKET';
      const nextVehicleBrand = safePayload.vehicleBrand ?? product.vehicleBrand ?? null;
      const nextOemNumber = safePayload.oemNumber ?? product.oemNumber ?? product.oemPartNumber ?? null;
      const nextManufacturerBrand = safePayload.manufacturerBrand ?? product.manufacturerBrand ?? product.brand ?? null;
      const nextHlaapNo = safePayload.hlaapNo ?? product.hlaapNo ?? null;

      ensureProductTypeFields({
        productType: nextType,
        vehicleBrand: nextVehicleBrand,
        oemNumber: nextOemNumber,
        manufacturerBrand: nextManufacturerBrand,
      });

      safePayload.productType = nextType;
      if (nextType === 'OEM') {
        safePayload.vehicleBrand = nextVehicleBrand;
        safePayload.oemNumber = nextOemNumber;
        safePayload.manufacturerBrand = null;
        safePayload.hlaapNo = null; // Clear HLAAP No for OEM products
      } else if (nextType === 'AFTERMARKET') {
        safePayload.manufacturerBrand = nextManufacturerBrand;
        safePayload.hlaapNo = nextHlaapNo; // Preserve HLAAP No for AFTERMARKET products
        safePayload.vehicleBrand = null;
        safePayload.oemNumber = null;
      }
    }

    const updated = await repo.updateById(productId, safePayload);

    if (primaryImageId) {
      const img = await ProductImage.findById(primaryImageId).lean();
      if (!img || String(img.productId) !== String(productId)) {
        error('Invalid primary image', 400);
      }

      await ProductImage.updateMany({ productId }, { isPrimary: false });
      await ProductImage.findByIdAndUpdate(primaryImageId, { isPrimary: true });
    }

    await cache.invalidateProduct(oldSlug, payload.slug);
    await cache.invalidateLists();
    await deletePatterns(
      [cacheKeys.catalog.product(oldSlug), payload.slug ? cacheKeys.catalog.product(payload.slug) : null, 'catalog:products:*'].filter(
        Boolean,
      ),
    );
    return updated;
  }

  async remove(productId, user) {
    if (!user) error('Unauthorized', 401);

    const product = await repo.findById(productId);
    if (!product) error('Product not found', 404);

    if (product.isDeleted) error('Product already deleted', 400);



    if (product.status === 'active' && user.role !== ROLES.ADMIN) {
      error('Active products cannot be deleted', 403);
    }

    const previousStatus = product.statusBeforeDelete || product.status || 'active';

    const deleted = await repo.updateById(productId, {
      isDeleted: true,
      deletedAt: new Date(),
      status: 'inactive',
      statusBeforeDelete: previousStatus,
    });

    await cache.invalidateProduct(product.slug);
    await cache.invalidateLists();
    await deletePatterns([cacheKeys.catalog.product(product.slug), 'catalog:products:*']);
    return deleted;
  }

  applyPricing(product, user) {
    if (
      user &&
      user.customerType === 'wholesale' &&
      user.verificationStatus === 'approved' &&
      product.wholesalePrice
    ) {
      return { ...product, price: product.wholesalePrice };
    }
    return { ...product, price: product.retailPrice };
  }

  applyPricingList(products, user) {
    return products.map((p) => this.applyPricing(p, user));
  }

  async attachAggregateRatings(product) {
    const reviewsService = require('../reviews/reviews.service');
    const agg = await reviewsService.getAggregate(product._id || product.id);
    return {
      ...product,
      averageRating: agg.averageRating,
      reviewCount: agg.reviewCount,
    };
  }

  async restore(productId, admin) {
    if (!admin || admin.role !== ROLES.ADMIN) error('Forbidden', 403);

    const product = await Product.findById(productId)
      .setOptions({ includeDeleted: true })
      .lean();
    if (!product) error('Product not found', 404);

    if (!product.isDeleted) error('Product is not deleted', 400);

    const allowedStatuses = new Set(['draft', 'active', 'inactive', 'blocked']);
    const nextStatus =
      product.statusBeforeDelete && allowedStatuses.has(product.statusBeforeDelete)
        ? product.statusBeforeDelete
        : 'active';

    const restored = await repo.updateById(productId, {
      isDeleted: false,
      deletedAt: null,
      status: nextStatus,
      statusBeforeDelete: null,
    }, { includeDeleted: true });

    await cache.invalidateProduct(product.slug);
    await cache.invalidateLists();
    await deletePatterns([cacheKeys.catalog.product(product.slug), 'catalog:products:*']);
    return restored;
  }

  async approve(productId, admin) {
    if (!admin || admin.role !== ROLES.ADMIN) error('Forbidden', 403);

    const product = await repo.findById(productId);
    if (!product) error('Product not found', 404);

    if (product.status === 'active') return product;

    const updated = await repo.updateById(productId, {
      status: 'active',
      approvedAt: new Date(),
    });

    await cache.invalidateProduct(product.slug);
    await cache.invalidateLists();
    await deletePatterns([cacheKeys.catalog.product(product.slug), 'catalog:products:*']);
    return updated;
  }

  async adminList(query = {}) {
    const { limit = 20, page = 1, status, categoryId, manufacturerBrand, productType, stockStatus, isFeatured, search } = query;
    const searchValue = search || '';

    logger.info('admin_list_query_received', { query, status });

    const filter = {};
    let includeDeleted = false;

    if (status === 'published') {
      filter.status = 'active';
      filter.isDeleted = false;
    } else if (status === 'draft') {
      filter.status = 'draft';
      filter.isDeleted = false;
    } else if (status === 'trashed') {
      filter.isDeleted = true;
      includeDeleted = true;
    } else if (!status || status === 'all') {
      filter.isDeleted = false;
    } else {
      // All = everything (Published + Draft + Trashed)
      // Don't set any status or isDeleted filter
      includeDeleted = true;
    }


    if (categoryId) filter.categoryId = categoryId;
    if (manufacturerBrand) filter.manufacturerBrand = manufacturerBrand;
    if (productType) {
      const types = String(productType)
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
        .map((t) => (t === 'AFTERMARKET' ? 'AFTERMARKET' : 'OEM'));
      if (types.length) filter.productType = { $in: types };
    }
    if (stockStatus === 'instock') filter.stockQty = { $gt: 0 };
    if (stockStatus === 'outstock') filter.stockQty = { $lte: 0 };
    if (typeof isFeatured === 'boolean') {
      filter.isFeatured = isFeatured;
    } else if (isFeatured !== undefined && isFeatured !== '') {
      filter.isFeatured = String(isFeatured).toLowerCase() === 'true';
    }
    if (searchValue) {
      const safeSearch = escapeRegex(searchValue);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { sku: { $regex: safeSearch, $options: 'i' } },
        { manufacturerBrand: { $regex: safeSearch, $options: 'i' } },
        { vehicleBrand: { $regex: safeSearch, $options: 'i' } },
        { oemNumber: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    logger.info('admin_list_filter_built', { filter, includeDeleted });

    const summary = String(query.summary || '').toLowerCase() === 'true';
    const projection = summary
      ? [
        '_id',
        'productId',
        'name',
        'sku',
        'stockQty',
        'retailPrice',
        'wholesalePrice',
        'categoryId',
        'productType',
        'oemNumber',
        'manufacturerBrand',
        'isFeatured',
        'status',
        'createdAt',
        'isDeleted',
        'aftermarketCopyId'
      ].join(' ')
      : null;

    const [listData, counts] = await Promise.all([
      repo.adminList({
        filter,
        limit,
        page,
        includeDeleted,
        projection
      }),
      repo.getStatusCounts()
    ]);

    logger.info('admin_list_result_ready', {
      productsFound: listData.products.length,
      counts,
    });

    await ensureListProductCodes(listData.products);

    const productIds = listData.products.map((p) => p._id);
    const categoryIds = listData.products
      .map((p) => p.categoryId)
      .filter(Boolean);

    const [categories, images] = await Promise.all([
      Category.find({ _id: { $in: categoryIds } }).lean(),
      ProductImage.find({ productId: { $in: productIds }, isDeleted: false })
        .sort({ isPrimary: -1, sortOrder: 1 })
        .lean(),
    ]);

    const categoryMap = new Map(categories.map((cat) => [String(cat._id), cat]));
    const imageMap = new Map();
    images.forEach((img) => {
      const key = String(img.productId);
      if (!imageMap.has(key)) {
        imageMap.set(key, img);
      }
    });

    const enrichedProducts = listData.products.map((product) => {
      const category = categoryMap.get(String(product.categoryId));
      const image = imageMap.get(String(product._id));
      return {
        ...normalizeProductFields(product),
        category,
        images: image ? [{ url: image.url, altText: image.altText }] : [],
      };
    });

    return {
      data: enrichedProducts,
      total: listData.total,
      totalPages: Math.ceil(listData.total / listData.limit),
      page: listData.page,
      limit: listData.limit,
      counts
    };
  }

  async permanentDelete(productId, admin) {
    if (!admin || admin.role !== ROLES.ADMIN) error('Forbidden', 403);

    const product = await Product.findById(productId)
      .setOptions({ includeDeleted: true })
      .lean();
    if (!product) error('Product not found', 404);

    if (!product.isDeleted) error('Only trashed products can be permanently deleted', 400);

    await ProductImage.deleteMany({ productId });
    const deleted = await repo.forceDelete(productId);

    await cache.invalidateProduct(product.slug);
    await cache.invalidateLists();
    await deletePatterns([cacheKeys.catalog.product(product.slug), 'catalog:products:*']);
    return deleted;
  }

  async emptyTrash(admin) {
    if (!admin || admin.role !== ROLES.ADMIN) error('Forbidden', 403);

    const trashedProducts = await Product.find({ isDeleted: true })
      .setOptions({ includeDeleted: true })
      .select('_id')
      .lean();

    const productIds = trashedProducts.map((p) => p._id);
    if (productIds.length) {
      await ProductImage.deleteMany({ productId: { $in: productIds } });
    }

    const result = await repo.removeAllTrashed();

    await cache.invalidateLists();
    await deletePatterns(['catalog:products:*']);
    return result;
  }

  async addImages(productId, files, user) {
    if (!user || user.role !== ROLES.ADMIN) error('Forbidden', 403);
    if (!files.length) error('No images uploaded', 400);
    files.forEach((file) => {
      if (!file.detectedMimeType) error('Invalid uploaded file type', 400);
    });

    const product = await repo.findById(productId);
    if (!product) error('Product not found', 404);

    const existingCount = await ProductImage.countDocuments({
      productId,
      isDeleted: false,
    });
    const hasPrimary = await ProductImage.findOne({
      productId,
      isPrimary: true,
      isDeleted: false,
    }).lean();

    const storage = await getStorageSettings();

    if (storage.driver === 's3') {
      const s3Config = storage.s3 || {};
      if (!s3Config.region || !s3Config.bucket) {
        error('S3 config missing', 400);
      }

      const formatted = [];
      const mediaItems = [];

      for (const [index, file] of files.entries()) {
        const mimeType = file.detectedMimeType;

        const key = s3.generateKey('products', mimeType);
        await s3.uploadFile({
          filePath: file.path,
          key,
          mimeType,
          config: s3Config,
        });
        await fs.unlink(file.path).catch(() => null);

        const url = s3.getPublicUrl(key, s3Config);
        formatted.push({
          productId,
          url,
          altText: product.name,
          isPrimary: !hasPrimary && index === 0,
          sortOrder: existingCount + index,
        });

        mediaItems.push({
          key,
          bucket: s3Config.bucket,
          url,
          mimeType,
          size: file.size || 0,
          usedIn: ['product'],
          createdBy: user._id,
        });
      }

      await ProductImage.insertMany(formatted);
      await Media.insertMany(mediaItems);

      await cache.invalidateProduct(product.slug);
      await cache.invalidateLists();
      await deletePatterns([
        cacheKeys.catalog.product(product.slug),
        'catalog:products:*',
      ]);

      return formatted;
    }

    const formatted = files.map((file, index) => ({
      productId,
      url: `/uploads/products/${file.filename}`,
      altText: product.name,
      isPrimary: !hasPrimary && index === 0,
      sortOrder: existingCount + index,
    }));

    await ProductImage.insertMany(formatted);
    await Media.insertMany(
      files.map((file) => ({
        key: `products/${file.filename}`,
        bucket: 'local',
        url: `/uploads/products/${file.filename}`,
        mimeType: file.detectedMimeType,
        size: file.size || 0,
        usedIn: ['product'],
        createdBy: user._id,
      })),
    );

    await cache.invalidateProduct(product.slug);
    await cache.invalidateLists();
    await deletePatterns([
      cacheKeys.catalog.product(product.slug),
      'catalog:products:*',
    ]);

    return formatted;
  }

  async attachAttributes(product) {
    if (!product) return product;
    const ProductAttributeValue = require('../../models/ProductAttributeValue.model');
    // Ensure the model is loaded if not already
    require('../../models/ProductAttribute.model');

    const values = await ProductAttributeValue.find({ productId: product._id })
      .populate({ path: 'attributeId', select: 'specName' })
      .lean();

    const attributes = values.map(v => ({
      name: v.attributeId ? v.attributeId.specName : 'Unknown',
      value: v.valueText || (v.valueNumber !== undefined ? String(v.valueNumber) : '') || v.valueSelect || (v.valueMultiSelect?.join(', ')) || ''
    }));

    return { ...product, attributes };
  }
  async attachBrandDetails(product) {
    if (!product || !product.manufacturerBrand) return product;
    try {
      // Try to find manufacturer brand by exact or case-insensitive name
      // We prioritize 'manufacturer' type if distinction exists, but simply name match is robust
      const safeManufacturerBrand = escapeRegex(product.manufacturerBrand.trim());
      const brand = await Brand.findOne({
        name: { $regex: new RegExp(`^${safeManufacturerBrand}$`, 'i') },
        // Optional: filter by type if needed, but generic match is safer for now
        // type: 'manufacturer' 
      }).select('logo name').lean();

      if (brand && brand.logo) {
        return {
          ...product,
          brandLogo: brand.logo,
          // Ensure casing matches the canonical brand name if desired
          manufacturerBrand: brand.name
        };
      }
    } catch (err) {
      logger.error('Failed to attach brand details', { error: err.message });
    }
    return product;
  }

  async attachCategoryHierarchy(product) {
    if (!product || !product.categoryId) return product;

    // Check if we accidentally already have it
    if (product.category && product.category.name) return product;

    try {
      const directCategory = await Category.findById(product.categoryId).lean();
      if (!directCategory) return product;

      if (directCategory.parentId) {
        // It's a subcategory
        const parentCategory = await Category.findById(directCategory.parentId).lean();
        return {
          ...product,
          category: parentCategory ? {
            name: parentCategory.name,
            slug: parentCategory.slug,
            _id: parentCategory._id
          } : {
            name: 'Category', // Fallback
            slug: ''
          },
          subCategory: {
            name: directCategory.name,
            slug: directCategory.slug,
            _id: directCategory._id
          },
          categorySlug: parentCategory ? parentCategory.slug : directCategory.slug
        };
      } else {
        // It's a root category
        return {
          ...product,
          category: {
            name: directCategory.name,
            slug: directCategory.slug,
            _id: directCategory._id
          },
          subCategory: null,
          categorySlug: directCategory.slug
        };
      }
    } catch (err) {
      logger.error('Failed to attach category hierarchy', { error: err.message });
      return product;
    }
  }

  async getCompatibility(productId) {
    const ProductCompatibility = require('../../models/ProductCompatibility.model');
    // Lazy load models to avoid circular dependencies if any, though here it's likely fine
    const Vehicle = require('../../modules/vehicle-management/models/Vehicle.model');

    const compatibility = await ProductCompatibility.findOne({ productId })
      .populate({
        path: 'vehicleIds',
        populate: [
          { path: 'brandId', select: 'name logo' },
          { path: 'modelId', select: 'name' },
          { path: 'yearId', select: 'year' },
          {
            path: 'attributeValueIds',
            populate: { path: 'attributeId', select: 'name' }
          }
        ]
      })
      .lean();

    if (!compatibility || !compatibility.vehicleIds) return {};

    // Group by Brand
    const grouped = {};
    compatibility.vehicleIds.forEach(v => {
      const brandName = v.brandId?.name || 'Other';
      if (!grouped[brandName]) {
        grouped[brandName] = [];
      }

      // Flatten attributes
      const attributes = v.attributeValueIds?.map(attrVal => ({
        name: attrVal.attributeId?.name,
        value: attrVal.value
      })) || [];

      grouped[brandName].push({
        _id: v._id,
        model: v.modelId?.name,
        year: v.yearId?.year,
        variant: v.variantName,
        fuel: attributes.find(a => a.name === 'Fuel Type')?.value || 'N/A', // Example logic
        engine: attributes.find(a => a.name === 'Engine')?.value || 'N/A',
        power: attributes.find(a => a.name === 'Power')?.value || 'N/A',
        engineCode: attributes.find(a => a.name === 'Engine Code')?.value || 'N/A',
        attributes // Keep all for dynamic rendering
      });
    });

    return grouped;
  }

  async getAlternatives(productId) {
    const Product = require('../../models/Product.model');
    const currentProduct = await repo.findById(productId);

    if (!currentProduct) return { oem: [], aftermarket: [] };

    const query = {
      _id: { $ne: productId },
      status: 'active',
      isDeleted: false
    };

    // Strategy: Match by OEM Part Number first (strongest signal)
    // If not present, fallback to same Category (weak signal, maybe too broad but better than nothing)
    const normalized = normalizeProductFields(currentProduct);
    if (normalized.oemNumber) {
      query.oemNumber = normalized.oemNumber;
    } else {
      // Fallback or maybe we don't want broad matching?
      // User request says "Fully dynamic recommendations (not static mapping)"
      // For now, let's limit to OEM number match for relevance.
      // If no OEM Number, maybe same SubCategory?
      query.categoryId = currentProduct.categoryId;
    }

    const alternatives = await Product.find(query).limit(20).lean();

    const normalizedAlternatives = normalizeProductList(alternatives);
    const oem = normalizedAlternatives.filter(p => p.productType === 'OEM');
    const aftermarket = normalizedAlternatives.filter(p => p.productType !== 'OEM'); // Default to Aftermarket

    const [oemWithImages, aftermarketWithImages] = await Promise.all([
      this.attachImages(oem),
      this.attachImages(aftermarket)
    ]);

    // Apply pricing? (Should include wholesale logic if needed, but this is public data usually)
    // We'll leave pricing raw here, controller can apply context if needed, but simplified is better.
    // Actually, let's apply standard pricing structure.

    return {
      oem: oemWithImages,
      aftermarket: aftermarketWithImages
    };
  }

  async duplicateAsAftermarket(productId, user) {
    if (!user || user.role !== ROLES.ADMIN) error('Forbidden', 403);

    const sourceProduct = await repo.findById(productId);
    if (!sourceProduct) error('Product not found', 404);

    // Validate that source is OEM
    const productType = sourceProduct.productType || sourceProduct.type || 'AFTERMARKET';
    if (productType !== 'OEM') {
      error('Only OEM products can be duplicated as Aftermarket', 400);
    }

    // Create a new slug for the duplicate
    const baseSlug = slugify(sourceProduct.name, { lower: true, strict: true, trim: true });
    let newSlug = `${baseSlug}-aftermarket`;
    let counter = 1;
    
    // Ensure slug uniqueness
    while (await repo.findAnyBySlug(newSlug)) {
      newSlug = `${baseSlug}-aftermarket-${counter}`;
      counter++;
    }

    // Prepare duplicate data
    const duplicateData = {
      name: sourceProduct.name,
      slug: newSlug,
      shortDescription: sourceProduct.shortDescription,
      longDescription: sourceProduct.longDescription,
      categoryId: sourceProduct.categoryId,
      sku: `${sourceProduct.sku || ''}-AM`, // Add suffix to SKU
      hsnCode: sourceProduct.hsnCode,
      productType: 'AFTERMARKET',
      manufacturerBrand: null, // Will be required, left null for user to fill
      vehicleBrand: null, // Not needed for aftermarket
      oemNumber: null, // Not needed for aftermarket
      retailPrice: sourceProduct.retailPrice,
      wholesalePrice: sourceProduct.wholesalePrice,
      minWholesaleQty: sourceProduct.minWholesaleQty,
      stockQty: sourceProduct.stockQty || 0,
      weight: sourceProduct.weight,
      length: sourceProduct.length,
      width: sourceProduct.width,
      height: sourceProduct.height,
      taxRate: sourceProduct.taxRate,
      taxClassKey: sourceProduct.taxClassKey,
      taxSlabs: sourceProduct.taxSlabs,
      tags: sourceProduct.tags,
      warrantyInfo: sourceProduct.warrantyInfo,
      returnPolicy: sourceProduct.returnPolicy,
      status: 'draft', // Set to draft as requested
      isFeatured: false,
      isDeleted: false,
      listingFeeStatus: 'waived'
    };

    // Sanitize HTML fields
    ['shortDescription', 'longDescription', 'returnPolicy', 'warrantyInfo'].forEach((field) => {
      if (duplicateData[field]) duplicateData[field] = sanitize(duplicateData[field]);
    });

    // Create the duplicate product
    const newProduct = await repo.create(duplicateData);

    // Copy images
    const sourceImages = await ProductImage.find({ 
      productId: sourceProduct._id, 
      isDeleted: false 
    }).lean();

    if (sourceImages.length) {
      const newImages = sourceImages.map((img, index) => ({
        productId: newProduct._id,
        url: img.url,
        altText: img.altText || newProduct.name,
        isPrimary: index === 0,
        sortOrder: index
      }));
      await ProductImage.insertMany(newImages);
    }

    // Record the aftermarket copy ID on the source OEM product so we can hide the duplicate button
    await repo.updateById(sourceProduct._id, { aftermarketCopyId: newProduct._id });

    await cache.invalidateLists();
    await deletePatterns(['catalog:products:*']);

    return newProduct;
  }
}

module.exports = new ProductService();
