const CouponUsage = require('../../models/CouponUsage.model');
const { getOffsetPagination } = require('../../utils/pagination');

class CouponUsageRepo {
  list(
    filter: Record<string, unknown> = {},
    pagination: Record<string, unknown> = {},
  ) {
    const { limit, skip } = getOffsetPagination(pagination);
    return CouponUsage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return CouponUsage.countDocuments(filter);
  }
}

module.exports = new CouponUsageRepo();

