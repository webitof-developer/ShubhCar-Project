const EmailTemplate = require('../../models/EmailTemplate.model');
const { getOffsetPagination } = require('../../utils/pagination');

class EmailTemplatesRepo {
  create(data) {
    return EmailTemplate.create(data);
  }

  list(
    filter: Record<string, unknown> = {},
    pagination: Record<string, unknown> = {},
  ) {
    const { limit, skip } = getOffsetPagination(pagination);
    return EmailTemplate.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return EmailTemplate.countDocuments(filter);
  }

  findById(id) {
    return EmailTemplate.findById(id).lean();
  }

  update(id, data) {
    return EmailTemplate.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  remove(id) {
    return EmailTemplate.findByIdAndDelete(id).lean();
  }
}

module.exports = new EmailTemplatesRepo();

