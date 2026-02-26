const Notification = require('../../models/Notification.model');
const { getOffsetPagination } = require('../../utils/pagination');

class NotificationsRepo {
  create(data) {
    return Notification.create(data);
  }

  findById(id) {
    return Notification.findById(id).lean();
  }

  list(
    filter: Record<string, unknown> = {},
    pagination: Record<string, unknown> = {},
  ) {
    const { limit, skip } = getOffsetPagination(pagination);
    return Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return Notification.countDocuments(filter);
  }

  update(id, data) {
    return Notification.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  remove(id) {
    return Notification.findByIdAndDelete(id).lean();
  }

  async markRead(id) {
    return Notification.findByIdAndUpdate(
      id,
      { status: 'read', readAt: new Date() },
      { new: true },
    ).lean();
  }

  async markAllRead(filter) {
    return Notification.updateMany(
      { ...filter, status: { $ne: 'read' } },
      { status: 'read', readAt: new Date() },
    );
  }

  countUnread(filter: Record<string, unknown> = {}) {
    return Notification.countDocuments({ ...filter, status: 'unread' });
  }
}

module.exports = new NotificationsRepo();

