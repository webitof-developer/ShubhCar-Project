import type { VehicleManagementRequestShape } from '../vehicle-management.types';
const VehicleVariant = require('../models/VehicleVariant.model');
const { getOffsetPagination } = require('../../../utils/pagination');

class VehicleVariantsRepo {
  list(filter, { page = 1, limit = 50 }: any = {}) {
    const pagination = getOffsetPagination({ page, limit });
    return VehicleVariant.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();
  }

  count(filter) {
    return VehicleVariant.countDocuments(filter);
  }

  create(data) {
    return VehicleVariant.create(data);
  }

  findById(id) {
    return VehicleVariant.findById(id).lean();
  }

  update(id, data) {
    return VehicleVariant.findByIdAndUpdate(id, data, { new: true });
  }

  softDelete(id) {
    return VehicleVariant.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }
}

module.exports = new VehicleVariantsRepo();
