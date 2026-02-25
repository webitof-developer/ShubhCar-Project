import type { TaxRequestShape } from './tax.types';
const TaxSlab = require('../../models/TaxSlab.model');
const { getOffsetPagination } = require('../../utils/pagination');

class TaxRepo {
  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return TaxSlab.find(filter)
      .sort({ hsnCode: 1, minAmount: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return TaxSlab.countDocuments(filter);
  }

  findByHsnCode(hsnCode) {
    return TaxSlab.findOne({ hsnCode }).lean();
  }

  findById(id) {
    return TaxSlab.findById(id).lean();
  }

  create(data) {
    return TaxSlab.create(data);
  }

  update(id, data) {
    return TaxSlab.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  remove(id) {
    return TaxSlab.findByIdAndDelete(id);
  }
}

module.exports = new TaxRepo();
