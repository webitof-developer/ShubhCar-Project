// @ts-nocheck
class PricingService {
  toNumberPrice(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  normalizePriceField(priceField) {
    if (priceField == null) return { mrp: 0, salePrice: null };
    if (typeof priceField === 'number' || typeof priceField === 'string') {
      return { mrp: this.toNumberPrice(priceField), salePrice: null };
    }

    const mrp = this.toNumberPrice(priceField.mrp);
    const saleRaw = priceField.salePrice;
    const salePrice = saleRaw == null ? null : this.toNumberPrice(saleRaw);
    return { mrp, salePrice };
  }

  isFlashActive(product, now = new Date()) {
    if (!product || !product.isFlashDeal) return false;
    const start = product.flashDealStartAt ? new Date(product.flashDealStartAt) : null;
    const end = product.flashDealEndAt ? new Date(product.flashDealEndAt) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }
    return start <= now && now <= end;
  }

  isApprovedWholesale(customerType) {
    return customerType === 'wholesale';
  }

  selectTier({ product, customerType, quantity = 1 }) {
    const safeQty = Math.max(1, Number(quantity || 1));
    const minWholesaleQty = Math.max(1, Number(product?.minWholesaleQty || 1));
    const hasWholesalePrice = product?.wholesalePrice != null;

    if (!this.isApprovedWholesale(customerType)) return 'retail';
    if (!hasWholesalePrice) return 'retail';
    if (safeQty < minWholesaleQty) return 'retail';
    return 'wholesale';
  }

  resolveTierPrice(priceField, flashActive) {
    const { mrp, salePrice } = this.normalizePriceField(priceField);
    if (flashActive && salePrice != null && salePrice > 0) return salePrice;
    return mrp;
  }

  resolveUnitPrice({ product, customerType, quantity = 1, now = new Date() }) {
    if (!product) return 0;

    const safeQty = Math.max(1, Number(quantity || 1));
    const minWholesaleQty = Math.max(1, Number(product?.minWholesaleQty || 1));
    const wholesaleApproved = this.isApprovedWholesale(customerType);

    if (wholesaleApproved && safeQty < minWholesaleQty) {
      return this.normalizePriceField(product?.retailPrice).mrp || 0;
    }

    const flashActive = this.isFlashActive(product, now);
    const tier = this.selectTier({ product, customerType, quantity: safeQty });

    if (tier === 'wholesale') {
      const wholesalePrice = this.resolveTierPrice(product.wholesalePrice, flashActive);
      if (wholesalePrice > 0) return wholesalePrice;
    }

    const retailPrice = this.resolveTierPrice(product.retailPrice, flashActive);
    if (retailPrice > 0) return retailPrice;

    if (tier === 'wholesale') {
      const wholesaleMrp = this.normalizePriceField(product.wholesalePrice).mrp;
      if (wholesaleMrp > 0) return wholesaleMrp;
    }

    return this.normalizePriceField(product.retailPrice).mrp || 0;
  }
}

module.exports = new PricingService();

