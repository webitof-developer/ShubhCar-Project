const ReturnRequest = require('../../models/ReturnRequest.model');
const { getOffsetPagination } = require('../../utils/pagination');

class ReturnRepo {
  create(data, session) {
    return ReturnRequest.create([data], { session }).then((r) => r[0]);
  }

  findById(id, session) {
    const query = ReturnRequest.findById(id);
    if (session) query.session(session);
    return query.lean();
  }

  list(
    filter: Record<string, unknown> = {},
    options: Record<string, unknown> = {},
  ) {
    const { session } = options;
    const { limit, skip } = getOffsetPagination(options);
    const query = ReturnRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (session) query.session(session);
    return query.lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return ReturnRequest.countDocuments(filter);
  }

  update(id, update, options: Record<string, unknown> = {}) {
    const queryOpts: Record<string, unknown> = { new: true, ...options };
    return ReturnRequest.findByIdAndUpdate(id, update, queryOpts).lean();
  }
}

module.exports = new ReturnRepo();

