const InventoryLog = require('../../models/InventoryLog.model');
const { getOffsetPagination } = require('../../utils/pagination');

class InventoryLogsRepo {
  list(
    filter: Record<string, unknown> = {},
    pagination: Record<string, unknown> = {},
  ) {
    const { limit, skip } = getOffsetPagination(pagination);
    return InventoryLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return InventoryLog.countDocuments(filter);
  }

  findById(id) {
    return InventoryLog.findById(id).lean();
  }
}

module.exports = new InventoryLogsRepo();

