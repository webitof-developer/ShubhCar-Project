const ProductAttributeValue = require('../../models/ProductAttributeValue.model');
const { getOffsetPagination } = require('../../utils/pagination');

class ProductAttributeRepository {
  getByProduct(productId, pagination: Record<string, unknown> = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return ProductAttributeValue.find({ productId })
      .populate('attributeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  countByProduct(productId) {
    return ProductAttributeValue.countDocuments({ productId });
  }

  getByProductAndAttr(productId, attributeId) {
    return ProductAttributeValue.findOne({ productId, attributeId }).lean();
  }

  upsert(productId, attributeId, valuePayload) {
    return ProductAttributeValue.findOneAndUpdate(
      { productId, attributeId },
      { productId, attributeId, ...valuePayload },
      { upsert: true, new: true },
    ).lean();
  }

  remove(productId, attributeId) {
    return ProductAttributeValue.findOneAndDelete({ productId, attributeId });
  }

  removeAllByProduct(productId) {
    return ProductAttributeValue.deleteMany({ productId });
  }
}

module.exports = new ProductAttributeRepository();

