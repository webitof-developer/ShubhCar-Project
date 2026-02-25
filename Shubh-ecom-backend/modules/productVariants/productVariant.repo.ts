import type { ProductVariantsRequestShape } from './productVariants.types';
// Stub repository retained only for backward compatibility after removing product variant feature.
// All methods return null/empty to indicate variants are no longer supported.
class ProductVariantRepository {
  getVariantById() {
    return Promise.resolve(null);
  }
}

module.exports = new ProductVariantRepository();
