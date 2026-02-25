import type { SeoRequestShape } from './seo.types';
const Seo = require('../../models/Seo.model');
const { getOffsetPagination } = require('../../utils/pagination');

class SeoRepository {
  async upsert(filter, data) {
    return Seo.findOneAndUpdate(filter, data, {
      upsert: true,
      new: true,
      runValidators: true,
    }).lean();
  }

  findOne(filter) {
    return Seo.findOne(filter).lean();
  }

  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return Seo.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return Seo.countDocuments(filter);
  }

  async deactivate(id) {
    return Seo.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }
}

module.exports = new SeoRepository();
