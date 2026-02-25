import type { SalesReportsRequestShape } from './salesReports.types';
const repo = require('./salesReports.repo');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class SalesReportsService {
  summary(params) {
    return repo.summary(params);
  }

  salesmanPerformance(params) {
    return repo.salesmanPerformance(params);
  }

  async list(query: any = {}) {
    const { page, limit, ...filter } = query;
    const pagination = getOffsetPagination({ page, limit });
    const [data, total] = await Promise.all([
      repo.list(filter, pagination),
      repo.count(filter),
    ]);
    return {
      reports: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async get(id) {
    const report = await repo.findById(id);
    if (!report) throw new Error('Sales report not found');
    return report;
  }

  create(payload) {
    return repo.create(payload);
  }

  async update(id, payload) {
    const updated = await repo.update(id, payload);
    if (!updated) throw new Error('Sales report not found');
    return updated;
    }

  async remove(id) {
    const deleted = await repo.remove(id);
    if (!deleted) throw new Error('Sales report not found');
    return deleted;
  }
}

module.exports = new SalesReportsService();
