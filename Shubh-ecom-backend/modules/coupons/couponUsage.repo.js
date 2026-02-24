const CouponUsage = require('../../models/CouponUsage.model');
const { getOffsetPagination } = require('../../utils/pagination');

class CouponUsageRepo {
  list(filter = {}, pagination = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return CouponUsage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter = {}) {
    return CouponUsage.countDocuments(filter);
  }
}

module.exports = new CouponUsageRepo();
