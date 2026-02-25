import type { CouponsRequestShape } from './coupons.types';
const CouponUsage = require('../../models/CouponUsage.model');
const { getOffsetPagination } = require('../../utils/pagination');

class CouponUsageRepo {
  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return CouponUsage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return CouponUsage.countDocuments(filter);
  }
}

module.exports = new CouponUsageRepo();
