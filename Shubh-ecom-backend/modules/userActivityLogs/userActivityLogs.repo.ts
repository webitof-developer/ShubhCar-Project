import type { UserActivityLogsRequestShape } from './userActivityLogs.types';
const UserActivityLog = require('../../models/UserActivityLog.model');
const { getOffsetPagination } = require('../../utils/pagination');

class UserActivityLogsRepo {
  create(data) {
    return UserActivityLog.create(data);
  }

  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return UserActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return UserActivityLog.countDocuments(filter);
  }
}

module.exports = new UserActivityLogsRepo();
