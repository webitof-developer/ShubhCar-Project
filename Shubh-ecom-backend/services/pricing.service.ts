// @ts-nocheck
class PricingService {
  /**
   * Extract a usable price from a price field that can be either:
   *  - a plain Number (e.g. 700)
   *  - an object { mrp, salePrice } (schema priceSchema)
   */
  extractPrice(priceField) {
    if (priceField == null) return 0;
    if (typeof priceField === 'number') return priceField;
    // Object form: prefer salePrice, fall back to mrp
    return priceField.salePrice ?? priceField.mrp ?? 0;
  }

  resolveUnitPrice({ product, customerType }) {
    if (!product) return 0;

    if (customerType === 'wholesale' && product.wholesalePrice) {
      const wp = this.extractPrice(product.wholesalePrice);
      if (wp > 0) return wp;
    }

    return this.extractPrice(product.retailPrice);
  }
}

module.exports = new PricingService();

