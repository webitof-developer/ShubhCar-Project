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

  async getSummary(filter: Record<string, unknown> = {}) {
    const pipeline = [
      { $match: filter },
      {
        $facet: {
          totals: [{ $count: 'total' }],
          today: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            },
            { $count: 'today' },
          ],
          uniqueUsers: [{ $group: { _id: '$userId' } }, { $count: 'count' }],
          failed: [
            {
              $match: {
                severity: { $in: ['error', 'critical'] },
              },
            },
            { $count: 'count' },
          ],
          resources: [{ $group: { _id: '$resource' } }, { $sort: { _id: 1 } }],
          actions: [{ $group: { _id: '$action' } }, { $sort: { _id: 1 } }],
          severities: [{ $group: { _id: '$severity' } }, { $sort: { _id: 1 } }],
          users: [
            {
              $group: {
                _id: '$actor.id',
                name: { $first: '$actor.name' },
                email: { $first: '$actor.email' },
              },
            },
            { $sort: { name: 1, email: 1 } },
            { $limit: 200 },
          ],
        },
      },
    ];

    const [result] = await UserActivityLog.aggregate(pipeline);
    return result || {};
  }
}

module.exports = new UserActivityLogsRepo();

