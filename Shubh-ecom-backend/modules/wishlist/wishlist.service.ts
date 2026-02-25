import type { WishlistRequestShape } from './wishlist.types';
const repo = require('./wishlist.repo');
const { error } = require('../../utils/apiResponse');
const wishlistCache = require('../../cache/wishlist.cache');
const Product = require('../../models/Product.model');
const ProductImage = require('../../models/ProductImage.model');
const {
  DEFAULT_LIMIT,
  getOffsetPagination,
  buildPaginationMeta,
} = require('../../utils/pagination');

class WishlistService {
  async list(userId, query: any = {}) {
    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });
    const useCache =
      pagination.page === 1 && pagination.limit === DEFAULT_LIMIT;
    const cacheKey = wishlistCache.key.user(userId);

    if (useCache) {
      const cached = await wishlistCache.get(cacheKey);
      if (cached) return cached;
    }

    const [items, total] = await Promise.all([
      repo.findByUser(userId, pagination),
      repo.countByUser(userId),
    ]);
    const enriched = await this.enrichItems(items);
    const response: any = {
      items: enriched,
      data: enriched,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };

    if (useCache) {
      await wishlistCache.set(cacheKey, response);
    }

    return response;
  }

  async add(userId, productId) {
    const existing = await repo.findOne(userId, productId);
    if (existing) return existing;
    const created = await repo.add(userId, productId);
    await wishlistCache.clearUser(userId);
    const [enriched] = await this.enrichItems([created]);
    return enriched || created;
  }

  async remove(userId, productId) {
    const deleted = await repo.remove(userId, productId);
    if (!deleted) error('Wishlist item not found', 404);
    await wishlistCache.clearUser(userId);
    return deleted;
  }

  async enrichItems(items: any[] = []) {
    if (!items.length) return [];
    const productIds = items.map((item) => item.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

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

    return items.map((item) => {
      const product = productMap.get(String(item.productId));
// @ts-ignore
      const productImages = product ? imageMap.get(String(product._id)) || [] : [] as any[];
      return {
        ...item,
        product: product ? { ...product, images: productImages } : null,
      };
    });
  }
}

module.exports = new WishlistService();
