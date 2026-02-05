class CommissionService {
  /**
   * For now: flat 10%
   * Later: category slabs
   */
  calculatePlatformCommission(amount) {
    return Math.round(amount * 0.1);
  }

  /**
   * Groups order items into a single commission bucket for the single-merchant setup.
   
   */
  buildVendorSplits(orderItems) {
    const total = (orderItems || []).reduce(
      (sum, item) => sum + (Number(item?.total) || 0),
      0,
    );

    if (!total) return [];

    return [
      {
        itemSubtotal: total,
        taxAmount: 0,
        shippingShare: 0,
      },
    ];
  }
}

module.exports = new CommissionService();
