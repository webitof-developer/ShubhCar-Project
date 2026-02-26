const Page = require('../../models/Page.model');
const { getOffsetPagination } = require('../../utils/pagination');

class PageRepository {
  async create(data) {
    const doc = await Page.create(data);
    return doc.toObject();
  }

  findById(id) {
    return Page.findById(id).lean();
  }

  findBySlug(slug, publishedOnly = true) {
    const filter: Record<string, unknown> = { slug };
    if (publishedOnly) filter.status = 'published';
    return Page.findOne(filter).lean();
  }

  list(
    filter: Record<string, unknown> = {},
    pagination: Record<string, unknown> = {},
  ) {
    const { limit, skip } = getOffsetPagination(pagination);
    return Page.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return Page.countDocuments(filter);
  }

  async update(id, data) {
    return Page.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async delete(id) {
    return Page.findByIdAndDelete(id).lean();
  }
}

module.exports = new PageRepository();

