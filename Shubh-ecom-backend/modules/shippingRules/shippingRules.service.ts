import type { ShippingRulesRequestShape } from './shippingRules.types';
const repo = require('./shippingRules.repo');
const { error } = require('../../utils/apiResponse');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class ShippingRulesService {
  async list(query: any = {}) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.country) filter.country = query.country;

    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });

    const [data, total] = await Promise.all([
      repo.list(filter, pagination),
      repo.count(filter),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  create(payload) {
    if (!payload.name) error('name is required', 400);
    if (payload.baseRate == null) error('baseRate is required', 400);
    return repo.create(payload);
  }

  update(id, payload) {
    return repo.update(id, payload);
  }

  remove(id) {
    return repo.remove(id);
  }
}

module.exports = new ShippingRulesService();
