import type { EmailTemplatesRequestShape } from './emailTemplates.types';
const repo = require('./emailTemplates.repo');
const { error } = require('../../utils/apiResponse');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class EmailTemplatesService {
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

  async get(id) {
    const tpl = await repo.findById(id);
    if (!tpl) error('Email template not found', 404);
    return tpl;
  }

  async create(payload) {
    return repo.create(payload);
  }

  async update(id, payload) {
    const updated = await repo.update(id, payload);
    if (!updated) error('Email template not found', 404);
    return updated;
  }

  async remove(id) {
    const deleted = await repo.remove(id);
    if (!deleted) error('Email template not found', 404);
    return deleted;
  }
}

module.exports = new EmailTemplatesService();
