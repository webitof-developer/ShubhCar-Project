import type { RolesRequestShape } from './roles.types';
const Role = require('../../models/Role.model');
const { getOffsetPagination } = require('../../utils/pagination');

class RolesRepo {
  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return Role.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return Role.countDocuments(filter);
  }

  findById(id) {
    return Role.findById(id).lean();
  }

  findBySlug(slug) {
    return Role.findOne({ slug }).lean();
  }

  findByName(name) {
    return Role.findOne({ name }).lean();
  }

  create(data) {
    return Role.create(data);
  }

  updateById(id, data) {
    return Role.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  deleteById(id) {
    return Role.findByIdAndDelete(id).lean();
  }
}

module.exports = new RolesRepo();
