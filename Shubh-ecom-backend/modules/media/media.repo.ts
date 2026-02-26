const Media = require('../../models/Media.model');
const { getOffsetPagination } = require('../../utils/pagination');

class MediaRepository {
  async create(data) {
    const doc = await Media.create(data);
    return doc.toObject();
  }

  async createMany(items: Array<Record<string, unknown>> = []) {
    if (!items.length) return [];
    const docs = await Media.insertMany(items);
    return docs.map((doc) => doc.toObject());
  }

  findById(id) {
    return Media.findOne({ _id: id, isDeleted: false }).lean();
  }

  list(
    filter: Record<string, unknown> = {},
    { limit = 20, page = 1 } = {},
  ) {
    const { limit: safeLimit, skip } = getOffsetPagination({ page, limit });

    return Media.find({ ...filter, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip(skip)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return Media.countDocuments({ ...filter, isDeleted: false });
  }

  async softDelete(id) {
    return Media.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    ).lean();
  }
}

module.exports = new MediaRepository();

