const pricingService = require('../../services/pricing.service');

describe('pricing.service resolveUnitPrice', () => {
  const now = new Date('2026-03-05T10:00:00.000Z');

  const baseProduct = {
    isFlashDeal: false,
    flashDealStartAt: null,
    flashDealEndAt: null,
    minWholesaleQty: 5,
    retailPrice: { mrp: 4000, salePrice: 2000 },
    wholesalePrice: { mrp: 3000, salePrice: 1500 },
  };

  it('uses retail mrp when flash deal is inactive', () => {
    const result = pricingService.resolveUnitPrice({
      product: baseProduct,
      customerType: 'retail',
      quantity: 1,
      now,
    });
    expect(result).toBe(4000);
  });

  it('uses retail sale price when flash deal is active for retail customer', () => {
    const result = pricingService.resolveUnitPrice({
      product: {
        ...baseProduct,
        isFlashDeal: true,
        flashDealStartAt: '2026-03-01T00:00:00.000Z',
        flashDealEndAt: '2026-03-10T23:59:59.000Z',
      },
      customerType: 'retail',
      quantity: 1,
      now,
    });
    expect(result).toBe(2000);
  });

  it('forces retail mrp for wholesale user when quantity is below minWholesaleQty', () => {
    const result = pricingService.resolveUnitPrice({
      product: {
        ...baseProduct,
        isFlashDeal: true,
        flashDealStartAt: '2026-03-01T00:00:00.000Z',
        flashDealEndAt: '2026-03-10T23:59:59.000Z',
      },
      customerType: 'wholesale',
      quantity: 3,
      now,
    });
    expect(result).toBe(4000);
  });

  it('uses wholesale mrp when quantity reaches minWholesaleQty and flash deal is inactive', () => {
    const result = pricingService.resolveUnitPrice({
      product: baseProduct,
      customerType: 'wholesale',
      quantity: 5,
      now,
    });
    expect(result).toBe(3000);
  });

  it('uses wholesale sale price when quantity reaches minWholesaleQty and flash deal is active', () => {
    const result = pricingService.resolveUnitPrice({
      product: {
        ...baseProduct,
        isFlashDeal: true,
        flashDealStartAt: '2026-03-01T00:00:00.000Z',
        flashDealEndAt: '2026-03-10T23:59:59.000Z',
      },
      customerType: 'wholesale',
      quantity: 5,
      now,
    });
    expect(result).toBe(1500);
  });
});
