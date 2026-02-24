const repo = require('./productAttributeValues.repo');
const { error } = require('../../utils/apiResponse');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class ProductAttributeValuesService {
  async list(query = {}) {
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
    const item = await repo.findById(id);
    if (!item) error('Product attribute value not found', 404);
    return item;
  }

  async create(payload) {
    return repo.create(payload);
  }

  async update(id, payload) {
    const updated = await repo.update(id, payload);
    if (!updated) error('Product attribute value not found', 404);
    return updated;
  }

  async remove(id) {
    const deleted = await repo.remove(id);
    if (!deleted) error('Product attribute value not found', 404);
    return deleted;
  }
}

module.exports = new ProductAttributeValuesService();
