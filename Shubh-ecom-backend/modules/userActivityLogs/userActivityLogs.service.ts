const repo = require('./userActivityLogs.repo');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');
const mongoose = require('mongoose');

class UserActivityLogsService {
  create(payload) {
    return repo.create(payload);
  }

  buildFilter(query: Record<string, unknown> = {}) {
    const filter: Record<string, any> = {};
    const {
      userId,
      resource,
      action,
      severity,
      from,
      to,
      search,
      activityType,
    } = query;

    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      filter.userId = new mongoose.Types.ObjectId(String(userId));
    }
    if (resource) filter.resource = String(resource);
    if (action) filter.action = String(action);
    if (severity) filter.severity = String(severity);
    if (activityType) filter.activityType = String(activityType);

    if (from || to) {
      filter.createdAt = {};
      const createdAtFilter = filter.createdAt as Record<string, Date>;
      if (from) filter.createdAt.$gte = new Date(String(from));
      if (to) {
        const endDate = new Date(String(to));
        endDate.setHours(23, 59, 59, 999);
        createdAtFilter.$lte = endDate;
      }
    }

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { message: regex },
        { resourceId: regex },
        { targetDisplay: regex },
        { activityType: regex },
        { 'actor.name': regex },
        { 'actor.email': regex },
      ];
    }

    return filter;
  }

  async list(query: Record<string, unknown> = {}) {
    const { page, limit } = query;
    const filter = this.buildFilter(query);
    const pagination = getOffsetPagination({ page, limit });
    const [data, total, summaryRaw] = await Promise.all([
      repo.list(filter, pagination),
      repo.count(filter),
      repo.getSummary(filter),
    ]);

    const summary = {
      total: summaryRaw?.totals?.[0]?.total || 0,
      today: summaryRaw?.today?.[0]?.today || 0,
      uniqueUsers: summaryRaw?.uniqueUsers?.[0]?.count || 0,
      failures: summaryRaw?.failed?.[0]?.count || 0,
      filters: {
        resources: (summaryRaw?.resources || [])
          .map((entry) => entry?._id)
          .filter(Boolean),
        actions: (summaryRaw?.actions || [])
          .map((entry) => entry?._id)
          .filter(Boolean),
        severities: (summaryRaw?.severities || [])
          .map((entry) => entry?._id)
          .filter(Boolean),
        users: (summaryRaw?.users || [])
          .filter((entry) => entry?._id)
          .map((entry) => ({
            id: String(entry._id),
            name: entry.name || '',
            email: entry.email || '',
          })),
      },
    };

    return {
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
      summary,
    };
  }
}

module.exports = new UserActivityLogsService();

