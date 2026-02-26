const repo = require('./userAddresses.repo');
const { error } = require('../../utils/apiResponse');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class UserAddressesService {
  async list(userId, query: Record<string, unknown> = {}) {
    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });
    const [data, total] = await Promise.all([
      repo.listByUser(userId, pagination),
      repo.countByUser(userId),
    ]);
    return {
      addresses: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async adminListByUser(userId, query: Record<string, unknown> = {}) {
    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });
    const [data, total] = await Promise.all([
      repo.listByUser(userId, pagination),
      repo.countByUser(userId),
    ]);
    return {
      addresses: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async get(id, userId) {
    const addr = await repo.findById(id);
    if (!addr) error('Address not found', 404);
    if (String(addr.userId) !== String(userId)) error('Forbidden', 403);
    return addr;
  }

  async create(userId, payload) {
    return repo.create({ ...payload, userId });
  }

  async update(id, userId, payload) {
    const existing = await repo.findById(id);
    if (!existing) error('Address not found', 404);
    if (String(existing.userId) !== String(userId)) error('Forbidden', 403);
    const updated = await repo.update(id, payload);
    return updated;
  }

  async remove(id, userId) {
    const existing = await repo.findById(id);
    if (!existing) error('Address not found', 404);
    if (String(existing.userId) !== String(userId)) error('Forbidden', 403);
    await repo.remove(id);
    return { deleted: true };
  }
}

module.exports = new UserAddressesService();

