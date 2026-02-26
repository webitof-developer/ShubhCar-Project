const ProductAttributeValue = require('../../models/ProductAttributeValue.model');
const { getOffsetPagination } = require('../../utils/pagination');

class ProductAttributeValuesRepo {
  create(data) {
    return ProductAttributeValue.create(data);
  }

  findById(id) {
    return ProductAttributeValue.findById(id).lean();
  }

  list(
    filter: Record<string, unknown> = {},
    pagination: Record<string, unknown> = {},
  ) {
    const { limit, skip } = getOffsetPagination(pagination);
    return ProductAttributeValue.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: Record<string, unknown> = {}) {
    return ProductAttributeValue.countDocuments(filter);
  }

  update(id, data) {
    return ProductAttributeValue.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  remove(id) {
    return ProductAttributeValue.findByIdAndDelete(id).lean();
  }
}

module.exports = new ProductAttributeValuesRepo();

