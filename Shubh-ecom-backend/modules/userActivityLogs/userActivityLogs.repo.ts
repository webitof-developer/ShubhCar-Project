const UserActivityLog = require('../../models/UserActivityLog.model');
const { getOffsetPagination } = require('../../utils/pagination');

class UserActivityLogsRepo {
  create(data) {
    return UserActivityLog.create(data);
  }

  list(
    filter: Record<string, unknown> = {},
    pagination: Record<string, unknown> = {},
  ) {
    const { limit, skip } = getOffsetPagination(pagination);
    return UserActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return UserActivityLog.countDocuments(filter);
  }
}

module.exports = new UserActivityLogsRepo();

