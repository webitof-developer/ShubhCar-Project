import type { UserActivityLogsRequestShape } from './userActivityLogs.types';
const repo = require('./userActivityLogs.repo');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class UserActivityLogsService {
  create(payload) {
    return repo.create(payload);
  }

  async list(query: any = {}) {
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
}

module.exports = new UserActivityLogsService();
