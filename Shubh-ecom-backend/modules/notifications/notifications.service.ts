const repo = require('./notifications.repo');
const { error } = require('../../utils/apiResponse');
const notificationCache = require('../../cache/notification.cache');
const ROLES = require('../../constants/roles');
const {
  DEFAULT_LIMIT,
  getOffsetPagination,
  buildPaginationMeta,
} = require('../../utils/pagination');

class NotificationsService {
  visibleFilter(user, filter: Record<string, unknown> = {}) {
    if (user.role === ROLES.ADMIN) return { ...filter };
    const or: unknown[] = [{ audience: 'user', userId: user.id }];
    return { ...filter, $or: or };
  }

  async create(payload) {
    if (!payload.userId && payload.audience !== ROLES.ADMIN) {
      error('userId required for user notifications', 400);
    }
    const created = await repo.create(payload);
    await notificationCache.clearUser(payload.userId);
    return created;
  }

  async list({ user, filter = {} }) {
// @ts-ignore
    const { page, limit, ...queryFilter } = filter || {};
    const pagination = getOffsetPagination({ page, limit });

    if (user.role === ROLES.ADMIN) {
      const [data, total] = await Promise.all([
        repo.list(queryFilter, pagination),
        repo.count(queryFilter),
      ]);
      return {
        items: data,
        data,
        pagination: buildPaginationMeta({ ...pagination, total }),
      };
    }

    const baseFilter = this.visibleFilter(user, queryFilter);
    const useCache =
      !Object.keys(queryFilter).length &&
      pagination.page === 1 &&
      pagination.limit === DEFAULT_LIMIT;
    const cacheKey = notificationCache.key.user(user.id, user.role);

    if (useCache) {
      const cached = await notificationCache.get(cacheKey);
      if (cached) return cached;
    }

    const [data, total] = await Promise.all([
      repo.list(baseFilter, pagination),
      repo.count(baseFilter),
    ]);
    const response = {
      items: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };

    if (useCache) {
      await notificationCache.set(cacheKey, response);
    }

    return response;
  }

  async get(id, user) {
    const notif = await repo.findById(id);
    if (!notif) error('Notification not found', 404);
    if (
      user.role !== ROLES.ADMIN &&
      String(notif.userId) !== String(user.id)
    ) {
      error('Forbidden', 403);
    }
    return notif;
  }

  async update(id, user, payload) {
    const existing = await repo.findById(id);
    if (!existing) error('Notification not found', 404);
    if (
      user.role !== ROLES.ADMIN &&
      String(existing.userId) !== String(user.id)
    ) {
      error('Forbidden', 403);
    }
    const updated = await repo.update(id, payload);
    await notificationCache.clearUser(existing.userId);
    return updated;
  }

  async remove(id, user) {
    const existing = await repo.findById(id);
    if (!existing) error('Notification not found', 404);
    if (user.role !== ROLES.ADMIN && String(existing.userId) !== String(user.id)) {
      error('Forbidden', 403);
    }
    await repo.remove(id);
    await notificationCache.clearUser(existing.userId);
    return { deleted: true };
  }

  async markRead(id, user) {
    const existing = await repo.findById(id);
    if (!existing) error('Notification not found', 404);
    if (
      user.role !== ROLES.ADMIN &&
      String(existing.userId) !== String(user.id)
    ) {
      error('Forbidden', 403);
    }
    const updated = await repo.markRead(id);
    await notificationCache.clearUser(existing.userId);
    return updated;
  }

  async markAllRead(user, payload: Record<string, unknown> = {}) {
    const allowedAudiences =
      user.role === ROLES.ADMIN
        ? ['user', ROLES.ADMIN]
        : ['user'];

    if (payload.audience && !allowedAudiences.includes(payload.audience)) {
      error('Forbidden', 403);
    }

    const filter = this.visibleFilter(
      user,
      payload.audience ? { audience: payload.audience } : {},
    );
    await repo.markAllRead(filter);
    await notificationCache.clearUser(user.id);
    return { updated: true };
  }

  async summary(user) {
    const filter = this.visibleFilter(user);
    const unread = await repo.countUnread(filter);
    return { unread };
  }
}

module.exports = new NotificationsService();

