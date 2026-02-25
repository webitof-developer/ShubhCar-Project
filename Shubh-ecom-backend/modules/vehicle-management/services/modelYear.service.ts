import type { VehicleManagementRequestShape } from '../vehicle-management.types';
const repo = require('../repositories/modelYear.repository');
const { error } = require('../../../utils/apiResponse');
const { getOffsetPagination, buildPaginationMeta } = require('../../../utils/pagination');

class VehicleModelYearsService {
  async list(query: any = {}) {
    const filter: any = {};
    if (query.modelId) filter.modelId = query.modelId;
    if (query.status) filter.status = query.status;
    if (query.year) filter.year = Number(query.year);

    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      repo.list(filter, pagination),
      repo.count(filter),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async create(payload) {
    if (!payload.modelId) error('modelId is required', 400);
    if (!payload.year) error('year is required', 400);
    
    // Check if exists (including deleted) to prevent duplicate key error
    const existing = await repo.findByModelAndYearIncludingDeleted(payload.modelId, payload.year);
    
    if (existing) {
      if (existing.isDeleted) {
        // Restore if soft-deleted
        return repo.restore(existing._id, { 
          isDeleted: false, 
          status: payload.status || 'active' 
        });
      } else {
        error('Vehicle model year already exists', 409);
      }
    }

    return repo.create(payload);
  }

  async get(id) {
    const item = await repo.findById(id);
    if (!item) error('Vehicle model year not found', 404);
    return item;
  }

  async update(id, payload) {
    const item = await repo.update(id, payload);
    if (!item) error('Vehicle model year not found', 404);
    return item;
  }

  async remove(id) {
    const item = await repo.softDelete(id);
    if (!item) error('Vehicle model year not found', 404);
    return item;
  }
}

module.exports = new VehicleModelYearsService();
