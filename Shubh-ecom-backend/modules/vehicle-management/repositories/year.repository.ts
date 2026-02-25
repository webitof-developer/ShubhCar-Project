import type { VehicleManagementRequestShape } from '../vehicle-management.types';
const VehicleYear = require('../models/VehicleYear.model');
const { getOffsetPagination } = require('../../../utils/pagination');

class VehicleYearsRepo {
  list(filter, { page = 1, limit = 50 }: any = {}) {
    const pagination = getOffsetPagination({ page, limit });
    return VehicleYear.find(filter)
      .sort({ year: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();
  }

  count(filter) {
    return VehicleYear.countDocuments(filter);
  }

  create(data) {
    return VehicleYear.create(data);
  }

  findById(id) {
    return VehicleYear.findById(id).lean();
  }

  findByYear(year) {
    return VehicleYear.findOne({ year }).lean();
  }

  update(id, data) {
    return VehicleYear.findByIdAndUpdate(id, data, { new: true });
  }

  softDelete(id) {
    return VehicleYear.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  // Bypass pre-find hook to find deleted/non-deleted items
  findByYearIncludingDeleted(year) {
    return VehicleYear.collection.findOne({ year });
  }

  // Bypass pre-find hook to update deleted items
  async restore(id, data) {
    const mongoose = require('mongoose');
    const res = await VehicleYear.collection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!res) return null;
    return res.value || res;
  }
}

module.exports = new VehicleYearsRepo();
