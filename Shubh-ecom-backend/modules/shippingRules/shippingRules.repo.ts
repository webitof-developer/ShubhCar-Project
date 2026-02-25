import type { ShippingRulesRequestShape } from './shippingRules.types';
const ShippingRule = require('../../models/ShippingRule.model');
const { getOffsetPagination } = require('../../utils/pagination');

class ShippingRulesRepo {
  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return ShippingRule.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return ShippingRule.countDocuments(filter);
  }

  create(data) {
    return ShippingRule.create(data);
  }

  update(id, data) {
    return ShippingRule.findByIdAndUpdate(id, data, { new: true });
  }

  remove(id) {
    return ShippingRule.findByIdAndDelete(id);
  }
}

module.exports = new ShippingRulesRepo();
