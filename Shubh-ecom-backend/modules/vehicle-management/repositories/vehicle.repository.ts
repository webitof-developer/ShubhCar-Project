const Vehicle = require('../models/Vehicle.model');
const { getOffsetPagination } = require('../../../utils/pagination');

class VehiclesRepo {
  list(filter, { page = 1, limit = 50 }: Record<string, unknown> = {}) {
    const pagination = getOffsetPagination({ page, limit });
    return Vehicle.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
  }

  count(filter) {
    return Vehicle.countDocuments(filter);
  }

  create(data) {
    return Vehicle.create(data);
  }

  findById(id) {
    return Vehicle.findById(id);
  }

  findOne(filter) {
    return Vehicle.findOne(filter);
  }

  update(id, data) {
    return Vehicle.findByIdAndUpdate(id, data, { new: true });
  }

  softDelete(id) {
    return Vehicle.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }
}

module.exports = new VehiclesRepo();

