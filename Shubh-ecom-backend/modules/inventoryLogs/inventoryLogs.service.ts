const repo = require('./inventoryLogs.repo');
const { error } = require('../../utils/apiResponse');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class InventoryLogsService {
  async list(query: Record<string, unknown> = {}) {
    const { page, limit, ...filter } = query;
    const pagination = getOffsetPagination({ page, limit });
    const [data, total] = await Promise.all([
      repo.list(filter, pagination),
      repo.count(filter),
    ]);
    return {
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async get(id) {
    const log = await repo.findById(id);
    if (!log) error('Inventory log not found', 404);
    return log;
  }
}

module.exports = new InventoryLogsService();

