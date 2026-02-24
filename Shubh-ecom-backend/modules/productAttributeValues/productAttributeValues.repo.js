const ProductAttributeValue = require('../../models/ProductAttributeValue.model');
const { getOffsetPagination } = require('../../utils/pagination');

class ProductAttributeValuesRepo {
  create(data) {
    return ProductAttributeValue.create(data);
  }

  findById(id) {
    return ProductAttributeValue.findById(id).lean();
  }

  list(filter = {}, pagination = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return ProductAttributeValue.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter = {}) {
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
