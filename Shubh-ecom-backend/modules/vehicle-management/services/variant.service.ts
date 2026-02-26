const repo = require('../repositories/variant.repository');
const { error } = require('../../../utils/apiResponse');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../../utils/escapeRegex');
const { getOffsetPagination, buildPaginationMeta } = require('../../../utils/pagination');

class VehicleVariantsService {
  async list(query: Record<string, unknown> = {}) {
    const filter: Record<string, unknown> = {};
    if (query.modelYearId) filter.modelYearId = query.modelYearId;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.name = { $regex: escapeRegex(query.search), $options: 'i' };
    }

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

  create(payload) {
    if (!payload.modelYearId) error('modelYearId is required', 400);
    if (!payload.name) error('name is required', 400);
    return repo.create(payload);
  }

  async get(id) {
    const item = await repo.findById(id);
    if (!item) error('Vehicle variant not found', 404);
    return item;
  }

  async update(id, payload) {
    const item = await repo.update(id, payload);
    if (!item) error('Vehicle variant not found', 404);
    return item;
  }

  async remove(id) {
    const item = await repo.softDelete(id);
    if (!item) error('Vehicle variant not found', 404);
    return item;
  }
}

module.exports = new VehicleVariantsService();

