import type { ReturnsRequestShape } from './returns.types';
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

  list(filter: any = {}, options: any = {}) {
    const { session } = options;
    const { limit, skip } = getOffsetPagination(options);
    const query = ReturnRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (session) query.session(session);
    return query.lean();
  }

  count(filter: any = {}) {
    return ReturnRequest.countDocuments(filter);
  }

  update(id, update, options: any = {}) {
    const queryOpts: any = { new: true, ...options };
    return ReturnRequest.findByIdAndUpdate(id, update, queryOpts).lean();
  }
}

module.exports = new ReturnRepo();
